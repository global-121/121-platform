import { DatePipe, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  model,
  output,
  Renderer2,
  signal,
  Type,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UrlTree } from '@angular/router';

import { get } from 'lodash';
import {
  FilterMatchMode,
  FilterMetadata,
  MenuItem,
  TableState,
} from 'primeng/api';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ContextMenuModule } from 'primeng/contextmenu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import {
  Table,
  TableLazyLoadEvent,
  TableModule,
  TableSelectAllChangeEvent,
} from 'primeng/table';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { ChipData } from '~/components/colored-chip/colored-chip.helper';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { Locale } from '~/utils/locale';

export enum QueryTableColumnType {
  DATE = 'date',
  MULTISELECT = 'multiselect',
  NUMERIC = 'numeric',
  TEXT = 'text',
}

// TODO: AB#30792 TField should also support "leaves" such as "user.name" or "user.address.city"
export type QueryTableColumn<TData, TField = keyof TData & string> = {
  header: string;
  field?: TField;
  fieldForSort?: TField; // defaults to field
  fieldForFilter?: TField; // defaults to field
  disableSorting?: boolean;
  disableFiltering?: boolean;
  filterMatchMode?: FilterMatchMode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: Type<TableCellComponent<TData, any>>;
} & (
  | {
      type: QueryTableColumnType.MULTISELECT;
      options: { label: string; value: number | string }[];
      getCellChipData?: (item: TData) => ChipData;
    }
  | {
      type?:
        | QueryTableColumnType.DATE
        | QueryTableColumnType.NUMERIC
        | QueryTableColumnType.TEXT; // defaults to QueryTableColumnType.TEXT
      getCellText?: (item: TData) => string;
      getCellRouterLink?: (
        item: TData,
      ) => (number | string)[] | null | string | undefined | UrlTree;
    }
);

export type QueryTableSelectionEvent<TData> = { selectAll: true } | TData[];

@Component({
  selector: 'app-query-table',
  standalone: true,
  imports: [
    TableModule,
    SkeletonModule,
    NgComponentOutlet,
    MenuModule,
    ContextMenuModule,
    ButtonModule,
    DatePipe,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    MultiSelectModule,
    FormsModule,
    SkeletonInlineComponent,
    ColoredChipComponent,
    AutoFocusModule,
    CheckboxModule,
  ],
  templateUrl: './query-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableComponent<TData extends { id: PropertyKey }, TContext> {
  locale = inject<Locale>(LOCALE_ID);
  paginateQueryService = inject(PaginateQueryService);

  items = input.required<TData[]>();
  isPending = input.required<boolean>();
  columns = input.required<QueryTableColumn<TData>[]>();
  localStorageKey = input.required<string>();
  contextMenuItems = input<MenuItem[]>();
  globalFilterFields = input<(keyof TData & string)[]>();
  expandableRowTemplate = input<Type<TableCellComponent<TData, TContext>>>();
  tableCellContext = input<TContext>();
  serverSideFiltering = input<boolean>(false);
  serverSideTotalRecords = input<number>();
  initialSortField = input<keyof TData & string>();
  initialSortOrder = input<-1 | 1>(1);
  enableSelection = input<boolean>(false);
  readonly onUpdateContextMenuItem = output<TData>();
  readonly onUpdatePaginateQuery = output<PaginateQuery>();
  readonly onUpdateSelection = output<QueryTableSelectionEvent<TData>>();

  @ViewChild('table') table: Table;
  @ViewChild('contextMenu') contextMenu: Menu;
  @ViewChild('extraOptionsMenu') extraOptionsMenu: Menu;
  @ViewChild('globalFilterContainer')
  globalFilterContainer: ElementRef<HTMLDivElement>;
  @ViewChild('globalFilterInput')
  globalFilterInput: ElementRef<HTMLInputElement>;

  constructor(private renderer: Renderer2) {
    this.renderer.listen('window', 'click', (e: Event) => {
      const globalFilterValue = this.globalFilterValue();

      const isNoGlobalFilterApplied =
        globalFilterValue === undefined || globalFilterValue === '';

      const hasCickedOutsideGlobalFilterContainer =
        e.target !== this.globalFilterContainer.nativeElement &&
        !this.globalFilterContainer.nativeElement.contains(e.target as Node);

      if (isNoGlobalFilterApplied && hasCickedOutsideGlobalFilterContainer) {
        this.globalFilterVisible.set(false);
      }
    });
  }

  /**
   * DISPLAY
   */
  expandedRowKeys = signal({});
  tableFilters = signal<
    Record<string, FilterMetadata | FilterMetadata[] | undefined>
  >({});
  // This is triggered whenever primeng saves the state of the table to local storage
  // which is an optimal time to update our local state, and make sure the table is showing the correct data

  onStateSave(event: TableState) {
    this.tableFilters.set({
      // clone to make sure to trigger change detection
      // https://stackoverflow.com/a/77532370
      ...(event.filters ?? {}),
    });

    this.expandedRowKeys.set({
      // clone to make sure to trigger change detection
      // https://stackoverflow.com/a/77532370
      ...(event.expandedRowKeys ?? {}),
    });
  }

  totalColumnCount = computed(
    () =>
      this.columns().length +
      (this.contextMenuItems() ? 1 : 0) +
      (this.expandableRowTemplate() ? 1 : 0) +
      (this.enableSelection() ? 1 : 0),
  );

  getCellText(column: QueryTableColumn<TData>, item: TData) {
    if (
      column.type !== QueryTableColumnType.MULTISELECT &&
      column.getCellText
    ) {
      return column.getCellText(item);
    }

    if (!column.field) {
      return;
    }

    // We're using lodash.get here to support "leaves" such as "user.username"
    const text = get(item, column.field);

    if (!text) {
      return;
    }

    if (column.type === QueryTableColumnType.DATE) {
      if (
        !(text instanceof Date) &&
        typeof text !== 'string' &&
        typeof text !== 'number'
      ) {
        throw new Error(
          `Expected field ${column.field} to be a Date or string, but got ${typeof text}`,
        );
      }
      return new DatePipe(this.locale).transform(new Date(text), 'short');
    }

    if (typeof text !== 'string') {
      throw new Error(
        `Expected field ${column.field} to be a string, but got ${typeof text}`,
      );
    }

    return text;
  }

  getColumnType(column: QueryTableColumn<TData>) {
    return column.type ?? QueryTableColumnType.TEXT;
  }

  /**
   *  FILTERS
   */
  globalFilterVisible = model<boolean>(false);

  clearAllFilters() {
    this.table.clear();
    localStorage.removeItem(this.localStorageKey());
    this.globalFilterVisible.set(false);
    this.tableFilters.set({});
    this.selectAll.set(false);
  }

  globalFilterValue = computed(() => {
    const tableFilters = this.tableFilters();

    const globalFilter = Array.isArray(tableFilters.global)
      ? tableFilters.global[0]
      : tableFilters.global;
    if (
      globalFilter &&
      typeof globalFilter.value === 'string' &&
      globalFilter.value !== ''
    ) {
      // without this, the global filter value is not restored properly from local storage
      return globalFilter.value;
    }

    return undefined;
  });

  isFiltered = computed(() => {
    if (this.globalFilterValue()) {
      return true;
    }

    // check if any filter is set by checking if any filter has a value
    return Object.values(this.tableFilters()).some((filterMetadata) => {
      if (!filterMetadata) {
        return false;
      }

      const filterMetadataArray: FilterMetadata[] = Array.isArray(
        filterMetadata,
      )
        ? filterMetadata
        : [filterMetadata];
      return filterMetadataArray.some(
        (filter) => filter.value !== undefined && filter.value !== null,
      );
    });
  });

  getColumnFilterField(column: QueryTableColumn<TData>) {
    if (column.disableFiltering) {
      return undefined;
    }
    return column.fieldForFilter ?? column.field;
  }

  getColumnMatchMode(column: QueryTableColumn<TData>) {
    if (column.filterMatchMode) {
      return column.filterMatchMode as string;
    }

    const type = this.getColumnType(column);
    switch (type) {
      case QueryTableColumnType.MULTISELECT:
        return FilterMatchMode.IN;
      // case QueryTableColumnType.DATE:
      case QueryTableColumnType.NUMERIC:
        return FilterMatchMode.EQUALS;
      default:
        return FilterMatchMode.CONTAINS;
    }
  }

  getColumnSortField(column: QueryTableColumn<TData>) {
    if (column.disableSorting) {
      return undefined;
    }
    return column.fieldForSort ?? column.field;
  }

  /**
   * LAZY LOADING
   */
  onLazyLoadEvent(event: TableLazyLoadEvent) {
    const paginateQuery =
      this.paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery(
        event,
      );
    if (!paginateQuery) {
      return;
    }
    this.onUpdatePaginateQuery.emit(paginateQuery);
  }

  totalRecords = computed(() => {
    if (!this.serverSideFiltering()) {
      return this.items().length;
    }

    const totalRecords = this.serverSideTotalRecords();

    if (totalRecords === undefined) {
      throw new Error('Server side filtering requires totalRecords to be set');
    }

    return totalRecords;
  });

  /**
   * ROW SELECTION
   */

  selectedItems = model<TData[]>([]);
  selectAll = model<boolean>(false);

  onSelectionChange(items: TData[]) {
    this.selectedItems.set(items);
    this.onUpdateSelection.emit(items);
  }

  onSelectAllChange(event: TableSelectAllChangeEvent) {
    const checked = event.checked;

    this.selectedItems.set([]);
    this.selectAll.set(checked);

    if (checked) {
      this.onUpdateSelection.emit({ selectAll: true });
    } else {
      this.onUpdateSelection.emit([]);
    }
  }

  selectedItemsCount = computed(() =>
    this.selectAll()
      ? this.serverSideTotalRecords()
      : this.selectedItems().length,
  );

  /**
   *  EXPANDABLE ROWS
   */
  expandAll() {
    this.expandedRowKeys.set(
      this.items().reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
    );
  }

  collapseAll() {
    this.expandedRowKeys.set({});
  }

  areAllRowsExpanded = computed(
    () =>
      this.items().length > 0 &&
      this.items().every((item) => this.expandedRowKeys()[item.id] === true),
  );

  /**
   *  PAGINATION
   */
  currentPageReportTemplate = computed(() => {
    const baseTemplate =
      $localize`:The contents of the square brackets should not be touched/changed:Showing [first] to [last] of [totalRecords] records`
        // this is a workaround because the i18n compiler does not support curly braces in the template
        .replaceAll('[', '{')
        .replaceAll(']', '}');

    const selectedItemsCount = this.selectedItemsCount();

    if (!selectedItemsCount) {
      return baseTemplate;
    }

    return (
      baseTemplate +
      ' ' +
      $localize`(${selectedItemsCount.toString()} selected)`
    );
  });
}

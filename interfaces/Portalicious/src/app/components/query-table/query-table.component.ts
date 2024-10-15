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

import {
  FilterMatchMode,
  FilterMetadata,
  MenuItem,
  TableState,
} from 'primeng/api';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { ContextMenuModule } from 'primeng/contextmenu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';

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

export type QueryTableColumn<TData, TField = keyof TData & string> = {
  header: string;
  field: TField;
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
  readonly onUpdateContextMenuItem = output<TData>();
  readonly onUpdatePaginateQuery = output<PaginateQuery>();

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
  // This is triggered whenever primeng saves the state of the table to local storage
  // which is an optimal time to update our local state, and make sure the table is showing the correct data
  onStateSave(event: TableState) {
    this.synchronizeFilters(event);
    this.synchronizeExpandedRowKeys(event);
  }

  totalColumnCount = computed(
    () =>
      this.columns().length +
      (this.contextMenuItems() ? 1 : 0) +
      (this.expandableRowTemplate() ? 1 : 0),
  );

  getCellText(column: QueryTableColumn<TData>, item: TData) {
    if (
      column.type !== QueryTableColumnType.MULTISELECT &&
      column.getCellText
    ) {
      return column.getCellText(item);
    }

    const text = item[column.field];

    if (text && column.type === QueryTableColumnType.DATE) {
      return new DatePipe(this.locale).transform(
        new Date(text as string),
        'short',
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
  globalFilterValue = model<string>();
  isFiltered = signal(false);

  clearAllFilters() {
    this.table.clear();
    this.globalFilterValue.set(undefined);
    localStorage.removeItem(this.localStorageKey());
    this.globalFilterVisible.set(false);
    this.isFiltered.set(false);
  }

  private synchronizeFilters(event: TableState) {
    if (!event.filters) {
      return;
    }

    let globalFilterValueFromEvent: string | undefined = undefined;

    // TS thinks this is always defined but it is not true
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (event.filters.global) {
      const globalFilter = Array.isArray(event.filters.global)
        ? event.filters.global[0]
        : event.filters.global;
      if (typeof globalFilter.value === 'string' && globalFilter.value !== '') {
        // without this, the global filter value is not restored properly from local storage
        globalFilterValueFromEvent = globalFilter.value;
      }
    }

    this.globalFilterValue.set(globalFilterValueFromEvent);

    if (globalFilterValueFromEvent) {
      this.isFiltered.set(true);
      return;
    }

    this.isFiltered.set(
      // check if any filter is set by checking if any filter has a value
      Object.values(event.filters).some((filterMetadata) => {
        const filterMetadataArray: FilterMetadata[] = Array.isArray(
          filterMetadata,
        )
          ? filterMetadata
          : [filterMetadata];
        return filterMetadataArray.some(
          (filter) => filter.value !== undefined && filter.value !== null,
        );
      }),
    );
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
   *  EXPANDABLE ROWS
   */
  expandedRowKeys = signal({});

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

  private synchronizeExpandedRowKeys(event: TableState) {
    if (!event.expandedRowKeys) {
      return;
    }
    this.expandedRowKeys.set({
      // clone to make sure to trigger change detection
      // https://stackoverflow.com/a/77532370
      ...event.expandedRowKeys,
    });
  }

  /**
   *  PAGINATION
   */
  currentPageReportTemplate =
    $localize`:The contents of the square brackets should not be touched/changed:Showing [first] to [last] of [totalRecords] records`
      // this is a workaround because the i18n compiler does not support curly braces in the template
      .replaceAll('[', '{')
      .replaceAll(']', '}');
}

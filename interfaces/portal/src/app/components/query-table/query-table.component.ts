/* eslint-disable sort-class-members/sort-class-members -- Disabling this rule in this file because the class members are grouped logically */

import {
  DatePipe,
  NgClass,
  NgComponentOutlet,
  NgTemplateOutlet,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  LOCALE_ID,
  model,
  output,
  signal,
  TemplateRef,
  Type,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  FilterMatchMode,
  FilterMetadata,
  MenuItem,
  TableState,
} from 'primeng/api';
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
import { get } from 'radashi';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { ChipData } from '~/components/colored-chip/colored-chip.helper';
import { QueryTableColumnManagementComponent } from '~/components/query-table/components/query-table-column-management/query-table-column-management.component';
import { QueryTableGlobalSearchComponent } from '~/components/query-table/components/query-table-global-search/query-table-global-search.component';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { Leaves } from '~/utils/leaves';
import { Locale } from '~/utils/locale';

export enum QueryTableColumnType {
  DATE = 'date',
  MULTISELECT = 'multiselect',
  NUMERIC = 'numeric',
  TEXT = 'text',
}

export type QueryTableColumn<TData, TField = Leaves<TData> & string> = {
  header: string;
  field: 'COMPUTED_FIELD' | TField; // 'COMPUTED_FIELD' is a special value that is used to indicate that the field is computed and should not be used for filtering or sorting
  fieldForSort?: TField; // defaults to field
  fieldForFilter?: TField; // defaults to field
  defaultHidden?: boolean;
  disableSorting?: boolean;
  disableFiltering?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- couldn't find a way to avoid any here
  component?: Type<TableCellComponent<TData, any>>;
} & (
  | {
      type: QueryTableColumnType.MULTISELECT;
      options: {
        label: string;
        value: number | string;
        icon?: string;
        count?: number;
      }[];
      getCellChipData?: (item: TData) => ChipData;
      displayAsPlainText?: boolean;
    }
  | {
      type?:
        | QueryTableColumnType.DATE
        | QueryTableColumnType.NUMERIC
        | QueryTableColumnType.TEXT; // defaults to QueryTableColumnType.TEXT
      getCellText?: (item: TData) => string;
      getCellRouterLink?: (item: TData) => RouterLink['routerLink'];
    }
);

export type QueryTableSelectionEvent<TData> = { selectAll: true } | TData[];

@Component({
  selector: 'app-query-table',
  imports: [
    TableModule,
    SkeletonModule,
    NgComponentOutlet,
    MenuModule,
    ContextMenuModule,
    ButtonModule,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    MultiSelectModule,
    FormsModule,
    SkeletonInlineComponent,
    ColoredChipComponent,
    RouterLink,
    CheckboxModule,
    QueryTableGlobalSearchComponent,
    QueryTableColumnManagementComponent,
    NgTemplateOutlet,
    NgClass,
  ],
  providers: [ToastService],
  templateUrl: './query-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableComponent<TData extends { id: PropertyKey }, TContext> {
  locale = inject<Locale>(LOCALE_ID);
  paginateQueryService = inject(PaginateQueryService);
  toastService = inject(ToastService);
  readonly rtlHelper = inject(RtlHelperService);

  readonly items = input.required<TData[]>();
  readonly isPending = input.required<boolean>();
  readonly columns = input.required<QueryTableColumn<TData>[]>();
  readonly localStorageKey = input<string>();
  readonly contextMenuItems = input<MenuItem[]>();
  readonly globalFilterFields = input<(keyof TData & string)[]>();
  readonly expandableRowTemplate =
    input<Type<TableCellComponent<TData, TContext>>>();
  readonly tableCellContext = input<TContext>();
  readonly serverSideFiltering = input<boolean>(false);
  readonly serverSideTotalRecords = input<number>();
  readonly initialSortField = input<keyof TData & string>();
  readonly initialSortOrder = input<-1 | 1>(1);
  readonly enableSelection = input<boolean>(false);
  readonly enableColumnManagement = input<boolean>(false);
  readonly updateContextMenuItem = output<TData>();
  readonly updatePaginateQuery = output<PaginateQuery>();

  readonly emptyMessage =
    contentChild<TemplateRef<unknown>>('tableEmptyMessage');
  readonly table = viewChild.required<Table>('table');
  readonly contextMenu = viewChild<Menu>('contextMenu');
  readonly extraOptionsMenu = viewChild<Menu>('extraOptionsMenu');

  readonly selectedColumnsStateKey = computed(() => {
    const key = this.localStorageKey();
    return key ? `${key}-selected-columns` : undefined;
  });

  /**
   * DISPLAY
   */
  readonly expandedRowKeys = signal({});
  readonly tableFilters = signal<
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

  readonly totalColumnCount = computed(
    () =>
      this.visibleColumns().length +
      (this.contextMenuItems() ? 1 : 0) +
      (this.expandableRowTemplate() ? 1 : 0) +
      (this.enableSelection() ? 1 : 0),
  );

  private getCellValue(column: QueryTableColumn<TData>, item: TData) {
    // We're using radashi.get here to support "leaves" such as "user.username"
    return get(item, column.field);
  }

  getCellText(column: QueryTableColumn<TData>, item: TData) {
    if (
      column.type !== QueryTableColumnType.MULTISELECT &&
      column.getCellText
    ) {
      return column.getCellText(item);
    }

    if (column.field === 'COMPUTED_FIELD') {
      return;
    }

    const text = this.getCellValue(column, item);

    if (!text) {
      return;
    }

    if (column.type === QueryTableColumnType.MULTISELECT) {
      const correspondingLabel = column.options.find(
        (option) => option.value === text,
      )?.label;

      if (correspondingLabel) {
        return correspondingLabel;
      }
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

    if (typeof text !== 'string' && typeof text !== 'number') {
      throw new Error(
        `Expected field ${column.field} to be a string or number, but got ${typeof text}`,
      );
    }

    return text.toString();
  }

  getMultiSelectCellIcon(
    column: {
      type: QueryTableColumnType.MULTISELECT;
    } & QueryTableColumn<TData>,
    item: TData,
  ) {
    const cellValue = this.getCellValue(column, item);

    if (!cellValue) {
      return;
    }

    return column.options.find((option) => option.value === cellValue)?.icon;
  }

  getColumnType(column: QueryTableColumn<TData>) {
    return column.type ?? QueryTableColumnType.TEXT;
  }

  /**
   *  FILTERS
   */
  readonly globalFilterVisible = model<boolean>(false);

  clearAllFilters() {
    this.table().clear();
    const localStorageKey = this.localStorageKey();
    if (localStorageKey) {
      localStorage.removeItem(localStorageKey);
    }
    this.globalFilterVisible.set(false);
    this.tableFilters.set({});
    this.resetSelection();
  }

  readonly globalFilterValue = computed(() => {
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

  readonly isFiltered = computed(() => {
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
    if (column.disableFiltering || column.field === 'COMPUTED_FIELD') {
      // filtering is disabled for computed fields
      return undefined;
    }
    return column.fieldForFilter ?? column.field;
  }

  getIsColumnFiltered(column: QueryTableColumn<TData>): boolean {
    const field = this.getColumnFilterField(column);
    if (!field) {
      return false;
    }
    const tableFilter = this.tableFilters()[field];
    const tableFilterMetadata = Array.isArray(tableFilter)
      ? tableFilter[0]
      : tableFilter;

    return !!tableFilterMetadata?.value;
  }

  getColumnMatchMode(column: QueryTableColumn<TData>): FilterMatchMode {
    const type = this.getColumnType(column);
    switch (type) {
      case QueryTableColumnType.MULTISELECT:
        return FilterMatchMode.IN;
      case QueryTableColumnType.DATE:
      case QueryTableColumnType.NUMERIC:
        return FilterMatchMode.EQUALS;
      case QueryTableColumnType.TEXT:
        return FilterMatchMode.CONTAINS;
    }
  }

  getColumnMatchModeOptions(
    column: QueryTableColumn<TData>,
  ): { label: string; value: FilterMatchMode }[] | undefined {
    const type = this.getColumnType(column);
    switch (type) {
      case QueryTableColumnType.TEXT:
        return [
          { label: $localize`Contains`, value: FilterMatchMode.CONTAINS },
          { label: $localize`Equal to`, value: FilterMatchMode.EQUALS },
          { label: $localize`Not equal to`, value: FilterMatchMode.NOT_EQUALS },
        ];
      case QueryTableColumnType.NUMERIC:
        return [
          { label: $localize`Equal to`, value: FilterMatchMode.EQUALS },
          { label: $localize`Not equal to`, value: FilterMatchMode.NOT_EQUALS },
          { label: $localize`Less than`, value: FilterMatchMode.LESS_THAN },
          {
            label: $localize`Greater than`,
            value: FilterMatchMode.GREATER_THAN,
          },
        ];
      case QueryTableColumnType.DATE:
        return [
          { label: $localize`Date is`, value: FilterMatchMode.EQUALS },
          {
            label: $localize`Date is before`,
            value: FilterMatchMode.LESS_THAN,
          },
          {
            label: $localize`Date is after`,
            value: FilterMatchMode.GREATER_THAN,
          },
        ];
      case QueryTableColumnType.MULTISELECT:
        // For multiselect, we do not have multiple match modes
        return undefined;
    }
  }

  getColumnSortField(column: QueryTableColumn<TData>) {
    if (column.disableSorting || column.field === 'COMPUTED_FIELD') {
      // sorting is disabled for computed fields
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
    this.updatePaginateQuery.emit(paginateQuery);
  }

  readonly totalRecords = computed(() => {
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

  readonly selectedItems = model<TData[]>([]);
  readonly selectAll = model<boolean>(false);
  readonly tableSelection = signal<QueryTableSelectionEvent<TData>>([]);

  onSelectionChange(items: TData[]) {
    this.selectedItems.set(items);
    this.tableSelection.set(items);
  }

  onSelectAllChange(event: TableSelectAllChangeEvent) {
    const checked = event.checked;

    this.selectedItems.set([]);
    this.selectAll.set(checked);

    if (checked) {
      this.tableSelection.set({ selectAll: true });
    } else {
      this.tableSelection.set([]);
    }
  }

  readonly selectedItemsCount = computed(() =>
    this.selectAll()
      ? this.serverSideTotalRecords()
      : this.selectedItems().length,
  );

  resetSelection() {
    this.selectedItems.set([]);
    this.selectAll.set(false);
    this.tableSelection.set([]);
  }

  public getActionData({
    fieldForFilter,
    currentPaginateQuery,
    noSelectionToastMessage,
    triggeredFromContextMenu = false,
    contextMenuItem,
  }: {
    fieldForFilter: keyof TData & string;
    noSelectionToastMessage: string;
    currentPaginateQuery?: PaginateQuery;
    triggeredFromContextMenu?: boolean;
    contextMenuItem?: TData;
  }) {
    let selection = this.tableSelection();

    if ('selectAll' in selection && !this.serverSideFiltering()) {
      const filteredValue = this.table().filteredValue;

      if (this.table().filteredValue) {
        selection = [...(filteredValue as TData[])];
      } else {
        // no filters are applied, so we can select all items
        selection = [...this.items()];
      }
    }

    if (Array.isArray(selection) && selection.length === 0) {
      if (triggeredFromContextMenu) {
        if (!contextMenuItem) {
          this.toastService.showGenericError();
          return;
        }
        selection = [contextMenuItem];
      } else {
        this.toastService.showToast({
          severity: 'error',
          detail: noSelectionToastMessage,
        });
        return;
      }
    }

    return this.paginateQueryService.selectionEventToActionData({
      selection,
      fieldForFilter,
      totalCount: this.totalRecords(),
      currentPaginateQuery,
      previewItemForSelectAll: this.items()[0],
      select: this.visibleColumns().map((column) => column.field),
    });
  }

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

  readonly areAllRowsExpanded = computed(
    () =>
      this.items().length > 0 &&
      this.items().every((item) => this.expandedRowKeys()[item.id] === true),
  );

  /**
   *  PAGINATION
   */
  readonly currentPageReportTemplate = computed(() => {
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

  /**
   * COLUMN VISIBILITY
   */
  readonly visibleColumns = model<QueryTableColumn<TData>[]>([]);

  private getStoredColumns(stateKey: string): null | QueryTableColumn<TData>[] {
    const storedColumns = localStorage.getItem(stateKey);
    if (!storedColumns) return null;

    return JSON.parse(storedColumns) as QueryTableColumn<TData>[];
  }

  private getMatchingColumns(
    storedColumns: QueryTableColumn<TData>[],
  ): QueryTableColumn<TData>[] {
    return storedColumns
      .map((column) => this.columns().find((c) => c.field === column.field))
      .filter((column) => column !== undefined);
  }

  private readonly defaultColumns = computed<QueryTableColumn<TData>[]>(() =>
    this.columns().filter((column) => !column.defaultHidden),
  );

  updateColumnVisibility(revertToDefault = false): void {
    const stateKey = this.selectedColumnsStateKey();
    if (!stateKey) {
      this.visibleColumns.set(this.defaultColumns());
      return;
    }

    if (revertToDefault) {
      localStorage.removeItem(stateKey);
      this.visibleColumns.set(this.defaultColumns());
      return;
    }

    const storedColumns = this.getStoredColumns(stateKey);
    this.visibleColumns.set(
      storedColumns
        ? this.getMatchingColumns(storedColumns)
        : this.defaultColumns(),
    );
  }

  columnVisibilityEffect = effect(() => {
    if (
      (!this.enableColumnManagement() || this.visibleColumns().length === 0) &&
      this.columns().length > 0
    ) {
      this.updateColumnVisibility();
    }
  });
}

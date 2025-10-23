/* eslint-disable sort-class-members/sort-class-members -- Disabling this rule in this file because the class members are grouped logically */

import { NgClass, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
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
  TemplateRef,
  Type,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MenuItem, TableState } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
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
import { QueryTableColumnManagementComponent } from '~/components/query-table/components/query-table-column-management/query-table-column-management.component';
import { QueryTableGlobalSearchComponent } from '~/components/query-table/components/query-table-global-search/query-table-global-search.component';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';
import { QueryTableColumnVisibilityService } from '~/components/query-table/services/query-table-column-visibility.service';
import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { QueryTablePaginationService } from '~/components/query-table/services/query-table-pagination.service';
import { QueryTableRowExpansionService } from '~/components/query-table/services/query-table-row-expansion.service';
import { QueryTableSelectionService } from '~/components/query-table/services/query-table-selection.service';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';
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
      displayAsChip?: boolean;
      getCellChipData?: (item: TData) => ChipData;
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
  providers: [
    ToastService,
    QueryTableFilterService,
    QueryTableSelectionService,
    QueryTableRowExpansionService,
    QueryTableCellService,
    QueryTableColumnVisibilityService,
    QueryTablePaginationService,
  ],
  templateUrl: './query-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableComponent<TData extends { id: PropertyKey }, TContext> {
  readonly locale = inject<Locale>(LOCALE_ID);
  readonly rtlHelper = inject(RtlHelperService);
  readonly trackingService = inject(TrackingService);

  // Local / helper services
  readonly filterService = inject(QueryTableFilterService<TData>);
  readonly selectionService = inject(QueryTableSelectionService<TData>);
  readonly rowExpansionService = inject(QueryTableRowExpansionService<TData>);
  readonly cellService = inject(QueryTableCellService<TData>);
  readonly columnVisibilityService = inject(
    QueryTableColumnVisibilityService<TData>,
  );
  readonly paginationService = inject(QueryTablePaginationService<TData>);

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
  readonly expandedRowKeys = this.rowExpansionService.expandedRowKeys;
  readonly tableFilters = this.filterService.tableFilters;

  // This is triggered whenever PrimeNG saves the state of the table to local storage which is an optimal time to update our local state,
  //  and make sure the table is showing the correct data.
  onStateSave(event: TableState) {
    this.filterService.updateTableFilters(event.filters ?? {});
    this.rowExpansionService.updateExpandedRowKeys(event.expandedRowKeys ?? {});
  }

  readonly totalColumnCount = computed(
    () =>
      this.columnVisibilityService.visibleColumns().length +
      (this.contextMenuItems() ? 1 : 0) +
      (this.expandableRowTemplate() ? 1 : 0) +
      (this.enableSelection() ? 1 : 0),
  );

  getCellText = this.cellService.getCellText.bind(this.cellService);

  getMultiSelectCellIcon = this.cellService.getMultiSelectCellIcon.bind(
    this.cellService,
  );

  getColumnType = this.cellService.getColumnType.bind(this.cellService);

  toggleMoreActionsMenu(event: Event, item: TData) {
    this.updateContextMenuItem.emit(item);
    this.extraOptionsMenu()?.toggle(event);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickMoreActionsMenuButton,
    });
  }

  showContextMenu() {
    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.showContextMenu,
    });
  }

  /**
   *  FILTERS
   */
  readonly globalFilterVisible = this.filterService.globalFilterVisible;
  readonly globalFilterValue = this.filterService.globalFilterValue;
  readonly isFiltered = this.filterService.isFiltered;

  clearAllFilters = () => {
    this.filterService.clearAllFilters({
      clearTable: () => {
        this.table().clear();
      },
      localStorageKey: this.localStorageKey(),
      resetSelection: () => {
        this.selectionService.resetSelection();
      },
    });
  };

  getColumnFilterField = this.filterService.getColumnFilterField.bind(
    this.filterService,
  );
  getIsColumnFiltered = this.filterService.getIsColumnFiltered.bind(
    this.filterService,
  );
  getColumnMatchMode = this.filterService.getColumnMatchMode.bind(
    this.filterService,
  );
  getColumnMatchModeOptions = this.filterService.getColumnMatchModeOptions.bind(
    this.filterService,
  );
  onShowColumnFilter = this.filterService.onShowColumnFilter.bind(
    this.filterService,
  );
  clearColumnFilter = this.filterService.clearColumnFilter.bind(
    this.filterService,
  );

  getColumnSortField = this.cellService.getColumnSortField.bind(
    this.cellService,
  );

  /**
   * LAZY LOADING
   */
  onLazyLoadEvent(event: TableLazyLoadEvent) {
    this.paginationService.onLazyLoadEvent(event, (query) => {
      this.updatePaginateQuery.emit(query);
    });
  }

  readonly totalRecords = computed(() =>
    this.paginationService.totalRecords()(
      this.items(),
      this.serverSideFiltering(),
    ),
  );

  readonly currentPageReportTemplate = computed(() =>
    this.paginationService.currentPageReportTemplate()(
      this.selectionService.selectedItemsCount(),
    ),
  );

  /**
   * ROW SELECTION
   */
  readonly selectedItems = model<TData[]>([]);
  readonly selectAll = model<boolean>(false);
  readonly tableSelection = this.selectionService.tableSelection;
  readonly selectedItemsCount = this.selectionService.selectedItemsCount;

  onSelectionChange = this.selectionService.onSelectionChange.bind(
    this.selectionService,
  );
  onSelectAllChange = this.selectionService.onSelectAllChange.bind(
    this.selectionService,
  );

  resetSelection = () => {
    this.selectionService.resetSelection();
  };

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
    return this.selectionService.getActionData({
      fieldForFilter,
      currentPaginateQuery,
      noSelectionToastMessage,
      triggeredFromContextMenu,
      contextMenuItem,
      serverSideFiltering: this.serverSideFiltering(),
      tableFilteredValue: this.table().filteredValue as null | TData[],
      items: this.items(),
      totalRecords: this.totalRecords(),
      visibleColumns: this.columnVisibilityService.visibleColumns(),
    });
  }

  /**
   *  EXPANDABLE ROWS
   */
  expandAll = () => {
    this.rowExpansionService.expandAll(this.items());
  };

  collapseAll = this.rowExpansionService.collapseAll.bind(
    this.rowExpansionService,
  );

  readonly areAllRowsExpanded = computed(() =>
    this.rowExpansionService.areAllRowsExpanded()(this.items()),
  );

  /**
   * COLUMN VISIBILITY
   */
  readonly visibleColumns = model<QueryTableColumn<TData>[]>([]);

  updateColumnVisibility = (revertToDefault = false) => {
    this.columnVisibilityService.updateColumnVisibility({
      columns: this.columns(),
      selectedColumnsStateKey: this.selectedColumnsStateKey(),
      revertToDefault,
    });
  };

  columnVisibilityEffect =
    this.columnVisibilityService.createColumnVisibilityEffect({
      columns: this.columns,
      enableColumnManagement: this.enableColumnManagement,
      selectedColumnsStateKey: this.selectedColumnsStateKey,
    });

  constructor() {
    // Set up service dependencies with provider functions
    this.selectionService.setServerSideTotalRecordsProvider(() =>
      this.serverSideTotalRecords(),
    );
    this.paginationService.setServerSideTotalRecordsProvider(() =>
      this.serverSideTotalRecords(),
    );

    // Sync models with service signals
    this.syncModelsWithServices();
  }

  private syncModelsWithServices() {
    // Sync visibleColumns model with service signal
    effect(() => {
      this.visibleColumns.set(this.columnVisibilityService.visibleColumns());
    });
    effect(() => {
      this.columnVisibilityService.visibleColumns.set(this.visibleColumns());
    });

    // Sync selection models with service signals
    effect(() => {
      this.selectedItems.set(this.selectionService.selectedItems());
    });
    effect(() => {
      this.selectionService.selectedItems.set(this.selectedItems());
    });

    effect(() => {
      this.selectAll.set(this.selectionService.selectAll());
    });
    effect(() => {
      this.selectionService.selectAll.set(this.selectAll());
    });
  }
}

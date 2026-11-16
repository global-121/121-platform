import { NgClass, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  LOCALE_ID,
  model,
  output,
  TemplateRef,
  Type,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MenuItem, TableState } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { ContextMenuModule } from '@openng/optimus-ui/contextmenu';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { Menu, MenuModule } from '@openng/optimus-ui/menu';
import { MultiSelectModule } from '@openng/optimus-ui/multiselect';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import {
  Table,
  TableLazyLoadEvent,
  TableModule,
} from '@openng/optimus-ui/table';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { QueryTableColumnManagementComponent } from '~/components/query-table/components/query-table-column-management/query-table-column-management.component';
import { QueryTableGlobalSearchComponent } from '~/components/query-table/components/query-table-global-search/query-table-global-search.component';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import type { QueryTableColumn } from '~/components/query-table/query-table.types';
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
} from '~/services/tracking/tracking.enums';
import { TrackingService } from '~/services/tracking/tracking.service';
import { ColorVariant } from '~/utils/color-variant.enum';
import { Locale } from '~/utils/locale';

/* eslint-disable sort-class-members/sort-class-members -- Disabling this rule in this file because the class members are grouped logically */
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
    InfoTooltipComponent,
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
  readonly serverSideFiltering = input(false);
  readonly serverSideTotalRecords = input<number>();
  readonly initialSortField = input<keyof TData & string>();
  readonly initialSortOrder = input<-1 | 1>(1);

  readonly enableSelection = input(false);
  readonly enableColumnManagement = input(false);
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

  readonly scrollable = input(false);
  readonly scrollHeight = input('400px');

  readonly dataTestId = input('query-table');

  readonly paginatorDropdownAppendTo = input<'body' | 'self' | HTMLElement>(
    'self',
  );

  readonly ColorVariant = ColorVariant;

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
      this.visibleColumns().length +
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

  showGlobalSearch = () => {
    if (this.globalFilterFields()?.length === 0) {
      return false;
    }
    if (this.globalFilterFields() || this.serverSideFiltering()) {
      return true;
    }
    return false;
  };

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
  getColumnMinFractionDigits = this.filterService.getColumnFractionDigits.bind(
    this.filterService,
  );
  getColumnMaxFractionDigits = this.filterService.getColumnFractionDigits.bind(
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
  readonly selectAll = model(false);
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
      visibleColumns: this.visibleColumns(),
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
  // `undefined` means: use the default columns
  private readonly selectedFields = linkedSignal(() =>
    this.columnVisibilityService.getStoredFields(
      this.selectedColumnsStateKey(),
    ),
  );

  readonly visibleColumns = computed(() =>
    this.columnVisibilityService.getVisibleColumns({
      columns: this.columns(),
      selectedFields: this.selectedFields(),
    }),
  );

  updateVisibleColumns(selectedColumns: QueryTableColumn<TData>[]) {
    const fields = selectedColumns.map((column) => column.field);
    this.columnVisibilityService.storeFields({
      stateKey: this.selectedColumnsStateKey(),
      fields,
    });
    this.selectedFields.set(fields);
  }

  resetVisibleColumns() {
    this.columnVisibilityService.clearStoredFields(
      this.selectedColumnsStateKey(),
    );
    this.selectedFields.set(undefined);
  }

  constructor() {
    // Set up service dependencies with provider functions
    this.selectionService.setServerSideTotalRecordsProvider(() =>
      this.serverSideTotalRecords(),
    );
    this.paginationService.setServerSideTotalRecordsProvider(() =>
      this.serverSideTotalRecords(),
    );

    this.syncModelsWithServices();
  }

  private syncModelsWithServices() {
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
/* eslint-enable sort-class-members/sort-class-members -- Re-enabling the rule for the rest of the codebase */

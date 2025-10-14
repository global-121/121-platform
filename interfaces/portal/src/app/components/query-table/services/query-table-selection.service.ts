import { computed, inject, model, signal } from '@angular/core';

import { TableSelectAllChangeEvent } from 'primeng/table';

import {
  QueryTableColumn,
  QueryTableSelectionEvent,
} from '~/components/query-table/query-table.component';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

export class QueryTableSelectionService<TData extends { id: PropertyKey }> {
  private readonly paginateQueryService = inject(PaginateQueryService);
  private readonly toastService = inject(ToastService);

  readonly selectedItems = model<TData[]>([]);
  readonly selectAll = model<boolean>(false);
  readonly tableSelection = signal<QueryTableSelectionEvent<TData>>([]);

  // Function to get server side total records from parent
  private getServerSideTotalRecords: () => number | undefined = () => undefined;

  readonly selectedItemsCount = computed(() =>
    this.selectAll()
      ? this.getServerSideTotalRecords()
      : this.selectedItems().length,
  );

  setServerSideTotalRecordsProvider(provider: () => number | undefined) {
    this.getServerSideTotalRecords = provider;
  }

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

  resetSelection() {
    this.selectedItems.set([]);
    this.selectAll.set(false);
    this.tableSelection.set([]);
  }

  getActionData({
    fieldForFilter,
    currentPaginateQuery,
    noSelectionToastMessage,
    triggeredFromContextMenu = false,
    contextMenuItem,
    serverSideFiltering,
    tableFilteredValue,
    items,
    totalRecords,
    visibleColumns,
  }: {
    fieldForFilter: keyof TData & string;
    noSelectionToastMessage: string;
    currentPaginateQuery?: PaginateQuery;
    triggeredFromContextMenu?: boolean;
    contextMenuItem?: TData;
    serverSideFiltering: boolean;
    tableFilteredValue: null | TData[];
    items: TData[];
    totalRecords: number;
    visibleColumns: QueryTableColumn<TData>[];
  }) {
    let selection = this.tableSelection();

    if ('selectAll' in selection && !serverSideFiltering) {
      if (tableFilteredValue) {
        selection = [...tableFilteredValue];
      } else {
        // no filters are applied, so we can select all items
        selection = [...items];
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
      totalCount: totalRecords,
      currentPaginateQuery,
      previewItemForSelectAll: items[0],
      select: visibleColumns.map((column) => column.field),
    });
  }
}

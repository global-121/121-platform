import { effect, signal, WritableSignal } from '@angular/core';

import { QueryTableColumn } from '~/components/query-table/query-table.types';

export class QueryTableColumnVisibilityService<TData> {
  readonly visibleColumns: WritableSignal<QueryTableColumn<TData>[]> = signal(
    [],
  );

  private getStoredColumns(stateKey: string): null | QueryTableColumn<TData>[] {
    const storedColumns = localStorage.getItem(stateKey);
    if (!storedColumns) return null;

    return JSON.parse(storedColumns) as QueryTableColumn<TData>[];
  }

  private getMatchingColumns(
    storedColumns: QueryTableColumn<TData>[],
    allColumns: QueryTableColumn<TData>[],
  ): QueryTableColumn<TData>[] {
    return storedColumns
      .map((column) => allColumns.find((c) => c.field === column.field))
      .filter((column) => column !== undefined);
  }

  private getDefaultColumns(
    columns: QueryTableColumn<TData>[],
  ): QueryTableColumn<TData>[] {
    return columns.filter((column) => !column.defaultHidden);
  }

  updateColumnVisibility(options: {
    columns: QueryTableColumn<TData>[];
    selectedColumnsStateKey: string | undefined;
    revertToDefault?: boolean;
  }): void {
    const {
      columns,
      selectedColumnsStateKey,
      revertToDefault = false,
    } = options;
    const stateKey = selectedColumnsStateKey;
    if (!stateKey) {
      this.visibleColumns.set(this.getDefaultColumns(columns));
      return;
    }

    if (revertToDefault) {
      localStorage.removeItem(stateKey);
      this.visibleColumns.set(this.getDefaultColumns(columns));
      return;
    }

    const storedColumns = this.getStoredColumns(stateKey);
    this.visibleColumns.set(
      storedColumns
        ? this.getMatchingColumns(storedColumns, columns)
        : this.getDefaultColumns(columns),
    );
  }

  createColumnVisibilityEffect(options: {
    columns: () => QueryTableColumn<TData>[];
    enableColumnManagement: () => boolean;
    selectedColumnsStateKey: () => string | undefined;
  }) {
    const { columns, enableColumnManagement, selectedColumnsStateKey } =
      options;
    return effect(() => {
      const allColumns = columns();

      if (allColumns.length === 0) {
        return;
      }

      if (!enableColumnManagement()) {
        this.updateColumnVisibility({
          columns: allColumns,
          selectedColumnsStateKey: selectedColumnsStateKey(),
        });
        return;
      }

      const visibleColumns = this.visibleColumns();

      if (visibleColumns.length === 0) {
        this.updateColumnVisibility({
          columns: allColumns,
          selectedColumnsStateKey: selectedColumnsStateKey(),
        });
        return;
      }

      // Keep the visible columns in sync when the column definitions change (e.g. refreshed data),
      // while preserving the current selection and order.
      const refreshedColumns = visibleColumns.map(
        (visibleColumn) =>
          allColumns.find((column) => column.field === visibleColumn.field) ??
          visibleColumn,
      );
      if (refreshedColumns.some((column, i) => column !== visibleColumns[i])) {
        this.visibleColumns.set(refreshedColumns);
      }
    });
  }
}

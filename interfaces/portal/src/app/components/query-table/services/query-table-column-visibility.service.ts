import { computed, effect, model, signal } from '@angular/core';

import { QueryTableColumn } from '../query-table.component';

export class QueryTableColumnVisibilityService<TData> {
  readonly visibleColumns = model<QueryTableColumn<TData>[]>([]);
  
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

  private getDefaultColumns(columns: QueryTableColumn<TData>[]): QueryTableColumn<TData>[] {
    return columns.filter((column) => !column.defaultHidden);
  }

  updateColumnVisibility(
    columns: QueryTableColumn<TData>[],
    selectedColumnsStateKey: string | undefined,
    revertToDefault = false,
  ): void {
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

  createColumnVisibilityEffect(
    columns: () => QueryTableColumn<TData>[],
    enableColumnManagement: () => boolean,
    selectedColumnsStateKey: () => string | undefined,
  ) {
    return effect(() => {
      if (
        (!enableColumnManagement() || this.visibleColumns().length === 0) &&
        columns().length > 0
      ) {
        this.updateColumnVisibility(columns(), selectedColumnsStateKey());
      }
    });
  }
}
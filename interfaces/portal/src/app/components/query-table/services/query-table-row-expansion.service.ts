import { computed, signal } from '@angular/core';

export class QueryTableRowExpansionService<TData extends { id: PropertyKey }> {
  readonly expandedRowKeys = signal<Record<PropertyKey, boolean>>({});

  readonly areAllRowsExpanded = computed(
    () => (items: TData[]) =>
      items.length > 0 &&
      items.every((item) => this.expandedRowKeys()[item.id]),
  );
  expandAll(items: TData[]) {
    this.expandedRowKeys.set(
      items.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
    );
  }

  collapseAll() {
    this.expandedRowKeys.set({});
  }

  updateExpandedRowKeys(expandedRowKeys: Record<PropertyKey, boolean>) {
    this.expandedRowKeys.set({
      // Clone to make sure to trigger change detection. See: https://stackoverflow.com/a/77532370
      ...expandedRowKeys,
    });
  }
}

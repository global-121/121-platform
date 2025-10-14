import { computed, signal } from '@angular/core';

export class QueryTableRowExpansionService<TData extends { id: PropertyKey }> {
  readonly expandedRowKeys = signal<Record<PropertyKey, boolean>>({});

  expandAll(items: TData[]) {
    this.expandedRowKeys.set(
      items.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
    );
  }

  collapseAll() {
    this.expandedRowKeys.set({});
  }

  readonly areAllRowsExpanded = computed(() => (items: TData[]) =>
    items.length > 0 &&
    items.every((item) => this.expandedRowKeys()[item.id] === true),
  );

  updateExpandedRowKeys(expandedRowKeys: Record<PropertyKey, boolean>) {
    this.expandedRowKeys.set({
      // clone to make sure to trigger change detection
      // https://stackoverflow.com/a/77532370
      ...(expandedRowKeys ?? {}),
    });
  }
}
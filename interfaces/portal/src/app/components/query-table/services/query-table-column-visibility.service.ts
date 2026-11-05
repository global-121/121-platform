import { QueryTableColumn } from '~/components/query-table/query-table.types';

export class QueryTableColumnVisibilityService<TData> {
  getStoredFields(stateKey: string | undefined): string[] | undefined {
    if (!stateKey) {
      return undefined;
    }

    const storedColumns = localStorage.getItem(stateKey);
    if (!storedColumns) {
      return undefined;
    }

    try {
      const parsed: unknown = JSON.parse(storedColumns);
      if (!Array.isArray(parsed)) {
        return undefined;
      }

      const fields = parsed.flatMap((column: unknown) =>
        typeof column === 'object' &&
        column !== null &&
        'field' in column &&
        typeof column.field === 'string'
          ? [column.field]
          : [],
      );

      return fields.length > 0 ? fields : undefined;
    } catch {
      // Corrupt or unexpected data: fall back to the default columns
      return undefined;
    }
  }

  storeFields({
    stateKey,
    fields,
  }: {
    stateKey: string | undefined;
    fields: string[];
  }): void {
    if (!stateKey) {
      return;
    }

    localStorage.setItem(
      stateKey,
      JSON.stringify(fields.map((field) => ({ field }))),
    );
  }

  clearStoredFields(stateKey: string | undefined): void {
    if (!stateKey) {
      return;
    }

    localStorage.removeItem(stateKey);
  }

  /**
   * Always resolves the columns from the given (latest) `columns`,
   * so that changes to the column definitions are reflected.
   */
  getVisibleColumns({
    columns,
    selectedFields,
  }: {
    columns: QueryTableColumn<TData>[];
    selectedFields: string[] | undefined;
  }): QueryTableColumn<TData>[] {
    const selectedColumns = (selectedFields ?? []).flatMap(
      (field) => columns.find((column) => column.field === field) ?? [],
    );

    if (selectedColumns.length > 0) {
      return selectedColumns;
    }

    return columns.filter((column) => !column.defaultHidden);
  }
}

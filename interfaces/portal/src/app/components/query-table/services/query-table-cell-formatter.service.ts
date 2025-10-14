import { DatePipe } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';

import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.component';
import { Locale } from '~/utils/locale';

@Injectable({
  providedIn: 'root',
})
export class QueryTableCellFormatterService {
  private readonly locale = inject<Locale>(LOCALE_ID);

  formatCellText<TData>(
    column: QueryTableColumn<TData>,
    cellValue: unknown,
  ): string | undefined {
    if (!cellValue) {
      return undefined;
    }

    switch (column.type) {
      case QueryTableColumnType.MULTISELECT:
        return this.formatMultiselectValue(column, cellValue);
      case QueryTableColumnType.DATE:
        return this.formatDateValue(column, cellValue);
      case QueryTableColumnType.NUMERIC:
      case QueryTableColumnType.TEXT:
      default:
        return this.formatDefaultValue(column, cellValue);
    }
  }

  private formatMultiselectValue<TData>(
    column: {
      type: QueryTableColumnType.MULTISELECT;
    } & QueryTableColumn<TData>,
    cellValue: unknown,
  ): string | undefined {
    return column.options.find((option) => option.value === cellValue)?.label;
  }

  private formatDateValue<TData>(
    column: QueryTableColumn<TData>,
    cellValue: unknown,
  ): string {
    if (
      !(cellValue instanceof Date) &&
      typeof cellValue !== 'string' &&
      typeof cellValue !== 'number'
    ) {
      throw new Error(
        `Expected field ${column.field} to be a Date or string, but got ${typeof cellValue}`,
      );
    }
    return (
      new DatePipe(this.locale).transform(new Date(cellValue), 'short') ?? ''
    );
  }

  private formatDefaultValue<TData>(
    column: QueryTableColumn<TData>,
    cellValue: unknown,
  ): string {
    if (typeof cellValue !== 'string' && typeof cellValue !== 'number') {
      throw new Error(
        `Expected field ${column.field} to be a string or number, but got ${typeof cellValue}`,
      );
    }
    return cellValue.toString();
  }
}

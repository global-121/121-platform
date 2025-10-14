import { DatePipe } from '@angular/common';
import { inject, LOCALE_ID } from '@angular/core';

import { get } from 'radashi';

import { ChipData } from '~/components/colored-chip/colored-chip.helper';
import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.component';
import { Locale } from '~/utils/locale';

export class QueryTableCellService<TData> {
  private readonly locale = inject<Locale>(LOCALE_ID);

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

  getCellChipData(
    column: {
      type: QueryTableColumnType.MULTISELECT;
      getCellChipData?: (item: TData) => ChipData;
    } & QueryTableColumn<TData>,
    item: TData,
  ) {
    if (column.getCellChipData) {
      return column.getCellChipData(item);
    }
    return undefined;
  }

  getColumnType(column: QueryTableColumn<TData>) {
    return column.type ?? QueryTableColumnType.TEXT;
  }

  getColumnSortField(column: QueryTableColumn<TData>) {
    if (column.disableSorting || column.field === 'COMPUTED_FIELD') {
      // sorting is disabled for computed fields
      return undefined;
    }
    return column.fieldForSort ?? column.field;
  }
}

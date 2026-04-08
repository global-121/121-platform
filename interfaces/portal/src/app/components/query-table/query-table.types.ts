import type { Type } from '@angular/core';
import type { RouterLink } from '@angular/router';

import type { ChipData } from '~/components/colored-chip/colored-chip.helper';
import type { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import type { Leaves } from '~/utils/leaves';

export enum QueryTableColumnType {
  DATE = 'date',
  MULTISELECT = 'multiselect',
  NUMERIC = 'numeric',
  TEXT = 'text',
}

export type QueryTableColumn<TData, TField = Leaves<TData> & string> = {
  header: string;
  field: 'COMPUTED_FIELD' | TField; // 'COMPUTED_FIELD' is a special value that is used to indicate that the field should not be used for filtering or sorting
  fieldForSort?: TField; // Defaults to type of `field`
  fieldForFilter?: TField; // Defaults to type of `field`
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
        | QueryTableColumnType.TEXT; // Default/fallback-type!
      getCellText?: (item: TData) => string;
      getCellRouterLink?: (item: TData) => RouterLink['routerLink'];
    }
);

export type QueryTableSelectionEvent<TData> = { selectAll: true } | TData[];

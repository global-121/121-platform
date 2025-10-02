import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, OutputEmitterRef } from '@angular/core';

import { endOfDay, startOfDay } from 'date-fns';
import { FilterMatchMode, FilterMetadata } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { QueryTableSelectionEvent } from '~/components/query-table/query-table.component';
import { localTimeToUtcTime } from '~/utils/local-time-to-utc-time';

export enum FilterOperator {
  BTW = '$btw',
  EQ = '$eq',
  GT = '$gt',
  ILIKE = '$ilike',
  IN = '$in',
  LT = '$lt',
  NOT = '$not',
}

export interface PaginateQuery {
  page?: number;
  limit?: number;
  sortBy?: [string, string][];
  search?: string;
  filter?: Record<string, string | string[]>;
  select?: string[];
}

export interface ActionDataWithPaginateQuery<T> {
  query: PaginateQuery;
  count: number;
  selection: QueryTableSelectionEvent<T>;
  selectAll: boolean;
  previewItem: T;
}

export abstract class IActionDataHandler<TData> {
  abstract readonly actionComplete: OutputEmitterRef<void>;
  abstract triggerAction(
    data: ActionDataWithPaginateQuery<TData>,
    ...args: unknown[]
  ): void;
}

@Injectable({
  providedIn: 'root',
})
export class PaginateQueryService {
  private convertPrimeNGMatchModeToFilterOperator({
    matchMode,
    isDate,
  }: { matchMode?: FilterMatchMode; isDate?: boolean } = {}): FilterOperator {
    if (!matchMode) {
      return FilterOperator.ILIKE;
    }

    switch (matchMode) {
      case FilterMatchMode.CONTAINS:
        return FilterOperator.ILIKE;
      case FilterMatchMode.EQUALS:
        return isDate ? FilterOperator.BTW : FilterOperator.EQ;
      case FilterMatchMode.NOT_EQUALS:
        return FilterOperator.NOT;
      case FilterMatchMode.IN:
        return FilterOperator.IN;
      case FilterMatchMode.GREATER_THAN:
        return FilterOperator.GT;
      case FilterMatchMode.LESS_THAN:
        return FilterOperator.LT;
      default:
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- false negative
        throw new Error(`Unsupported match mode: ${matchMode.toString()}`);
    }
  }

  private convertPrimeNGFilterMetadataToValueAndOperator(
    filter: FilterMetadata | FilterMetadata[] | undefined,
  ):
    | {
        value: string;
        operator: FilterOperator;
      }
    | undefined {
    const filterObj = Array.isArray(filter) ? filter[0] : filter;
    if (!filterObj || filterObj.value === null) {
      return;
    }

    const filterValue: unknown = filterObj.value;
    const operator = this.convertPrimeNGMatchModeToFilterOperator({
      matchMode: filterObj.matchMode,
      isDate: filterValue instanceof Date,
    });

    let filterValueString: string;

    if (Array.isArray(filterValue)) {
      if (filterValue.length === 0) {
        return;
      }

      filterValueString = filterValue.join(',');
    } else if (typeof filterValue === 'string') {
      filterValueString = filterValue;
    } else if (typeof filterValue === 'number') {
      filterValueString = filterValue.toString();
    } else if (filterValue instanceof Date) {
      filterValueString = this.getDateFilterValue(
        filterValue,
        filterObj.matchMode,
      );
    } else {
      throw new Error(`Unexpected filter value type: ${typeof filterValue}`);
    }

    return {
      operator,
      value: filterValueString,
    };
  }

  private getDateFilterValue(date: Date, matchMode?: string): string {
    // Calculate the start and end of the day in the client's local timezone.
    // This defines the filter window based on the user's perception of "day."
    const startOfDayLocal = startOfDay(date);
    const endOfDayLocal = endOfDay(date);

    // Convert the start and end of the day from the client's timezone to UTC.
    // This step is necessary because the data is stored in UTC in the backend.
    // By converting to UTC, we ensure that the filter window aligns correctly with the stored data.
    const startOfDayUtcIso = localTimeToUtcTime(startOfDayLocal).toISOString();
    const endOfDayUtcIso = localTimeToUtcTime(endOfDayLocal).toISOString();
    switch (matchMode) {
      case FilterMatchMode.EQUALS:
        return `${startOfDayUtcIso},${endOfDayUtcIso}`;
      case FilterMatchMode.GREATER_THAN:
        return endOfDayUtcIso;
      case FilterMatchMode.LESS_THAN:
        return startOfDayUtcIso;
      default:
        return date.toISOString();
    }
  }

  private convertPrimeNGLazyLoadFilterToPaginateFilter(
    filters: TableLazyLoadEvent['filters'],
  ) {
    return Object.entries(filters ?? {}).reduce<{
      filter?: PaginateQuery['filter'];
      search?: string;
    }>((acc, [filterKey, filter]) => {
      const valueAndOperator =
        this.convertPrimeNGFilterMetadataToValueAndOperator(filter);

      if (!valueAndOperator) {
        return acc;
      }

      const { operator, value } = valueAndOperator;

      if (filterKey === 'global') {
        return {
          ...acc,
          search: value,
        };
      }

      return {
        ...acc,
        filter: {
          ...(acc.filter ?? {}),
          [filterKey]: `${operator}:${value}`,
        },
      };
    }, {});
  }

  public convertPrimeNGLazyLoadEventToPaginateQuery(
    event: TableLazyLoadEvent,
  ): PaginateQuery | undefined {
    if (event.first == undefined || !event.rows) {
      // Should never happen, but makes TS happy
      throw new Error(`An unexpected error occurred`);
    }

    const { filter, search } =
      this.convertPrimeNGLazyLoadFilterToPaginateFilter(event.filters);

    let sortBy: PaginateQuery['sortBy'];

    if (event.sortField && event.sortOrder) {
      const direction = event.sortOrder === 1 ? 'ASC' : 'DESC';
      const field = Array.isArray(event.sortField)
        ? event.sortField[0]
        : event.sortField;
      sortBy = [[field, direction]];
    }

    return {
      page: event.first / event.rows + 1,
      limit: event.rows,
      sortBy,
      filter,
      search,
    };
  }

  public paginateQueryToHttpParamsObject(
    query?: PaginateQuery,
  ): Exclude<HttpParamsOptions['fromObject'], undefined> {
    const params: HttpParamsOptions['fromObject'] = {};

    if (!query) {
      return params;
    }

    if (query.page) {
      params.page = query.page.toString();
    }

    if (query.limit) {
      params.limit = query.limit.toString();
    }

    if (query.sortBy) {
      params.sortBy = query.sortBy.map(
        ([column, direction]) => `${column}:${direction}`,
      );
    }

    if (query.search) {
      params.search = query.search;
    }

    if (query.filter) {
      Object.entries(query.filter).forEach(([column, value]) => {
        if (Array.isArray(value)) {
          params[`filter.${column}`] = value.join(',');
        } else {
          params[`filter.${column}`] = value;
        }
      });
    }

    if (query.select) {
      params.select = query.select.join(',');
    }

    return params;
  }

  public selectionEventToActionData<TData>({
    selection,
    fieldForFilter,
    totalCount,
    currentPaginateQuery = {},
    previewItemForSelectAll,
    select,
  }: {
    selection: QueryTableSelectionEvent<TData>;
    fieldForFilter: keyof TData & string;
    totalCount: number;
    currentPaginateQuery?: PaginateQuery;
    previewItemForSelectAll: TData;
    select?: string[];
  }): ActionDataWithPaginateQuery<TData> {
    if ('selectAll' in selection) {
      // Apply action to all items...
      return {
        query: {
          ...currentPaginateQuery,
          // ...including the ones in other pages
          page: undefined,
          limit: undefined,
          filter: {
            // We want to ignore any manual filters set by the user, but ALWAYS exclude deleted registrations via this filter
            status: `${FilterOperator.NOT}:${RegistrationStatusEnum.deleted}`,
          },
          select,
        },
        count: totalCount,
        selection,
        selectAll: true,
        previewItem: previewItemForSelectAll,
      };
    }

    return {
      query: {
        filter: {
          [fieldForFilter]: `${FilterOperator.IN}:${selection.map((r) => r[fieldForFilter]).join(',')}`,
        },
        select,
      },
      count: selection.length,
      selection,
      selectAll: false,
      previewItem: selection[0],
    };
  }

  public singleItemToActionData<TData>({
    item,
    fieldForFilter,
  }: {
    item: TData;
    fieldForFilter: keyof TData & string;
  }) {
    return this.selectionEventToActionData({
      selection: [item],
      fieldForFilter,
      totalCount: 1,
      previewItemForSelectAll: item,
    });
  }
}

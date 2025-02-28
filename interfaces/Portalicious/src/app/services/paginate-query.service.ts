import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, OutputEmitterRef } from '@angular/core';

import { FilterMatchMode, FilterMetadata } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

import { QueryTableSelectionEvent } from '~/components/query-table/query-table.component';

export enum FilterOperator {
  EQ = '$eq',
  ILIKE = '$ilike',
  IN = '$in',
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
  private convertPrimeNGMatchModeToFilterOperator(
    matchMode?: FilterMatchMode,
  ): FilterOperator {
    switch (matchMode) {
      case FilterMatchMode.CONTAINS:
        return FilterOperator.ILIKE;
      case FilterMatchMode.EQUALS:
        return FilterOperator.EQ;
      case FilterMatchMode.IN:
        return FilterOperator.IN;
      default:
        return FilterOperator.ILIKE;
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

    const operator = this.convertPrimeNGMatchModeToFilterOperator(
      filterObj.matchMode,
    );

    const filterValue: unknown = filterObj.value;
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
      // Removing timezone offset to avoid issues where the date is off by a day
      filterValue.setMinutes(-filterValue.getTimezoneOffset() + 1);
      filterValueString = filterValue.toISOString().substring(0, 10);
    } else {
      throw new Error(`Unexpected filter value type: ${typeof filterValue}`);
    }

    return {
      operator,
      value: filterValueString,
    };
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
  }: {
    selection: QueryTableSelectionEvent<TData>;
    fieldForFilter: keyof TData & string;
    totalCount: number;
    currentPaginateQuery?: PaginateQuery;
    previewItemForSelectAll: TData;
  }): ActionDataWithPaginateQuery<TData> {
    if ('selectAll' in selection) {
      // Apply action to all items...
      return {
        query: {
          ...currentPaginateQuery,
          // ...including the ones in other pages
          page: undefined,
          limit: undefined,
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

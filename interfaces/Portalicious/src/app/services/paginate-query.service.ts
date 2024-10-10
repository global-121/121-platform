import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { FilterMatchMode, FilterMetadata } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

export enum FilterOperator {
  EQ = '$eq',
  ILIKE = '$ilike',
  IN = '$in',
}

// TODO: AB#30152 This type could be taken from the 121-service
// export type PaginateQuery = Parameters<RegistrationsController['findAll']>[0];
export interface PaginateQuery {
  page?: number;
  limit?: number;
  sortBy?: [string, string][];
  search?: string;
  filter?: Record<string, string | string[]>;
  select?: string[];
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

  public paginateQueryToHttpParams(query?: PaginateQuery) {
    let params = new HttpParams();

    if (!query) {
      return params;
    }

    if (query.page) {
      params = params.set('page', query.page);
    }

    if (query.limit) {
      params = params.set('limit', query.limit);
    }

    if (query.sortBy) {
      query.sortBy.forEach(([column, direction]) => {
        params = params.set(`sortBy`, `${column}:${direction}`);
      });
    }

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.filter) {
      Object.entries(query.filter).forEach(([column, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            params = params.append(`filter.${column}`, v);
          });
        } else {
          params = params.set(`filter.${column}`, value);
        }
      });
    }

    if (query.select) {
      query.select.forEach((column) => {
        params = params.append('select', column);
      });
    }

    return params;
  }
}

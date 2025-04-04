import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { endOfDay, startOfDay } from 'date-fns';
import { FilterMatchMode, FilterMetadata } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

import {
  FilterOperator,
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';

describe('PaginateQueryService', () => {
  let service: PaginateQueryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginateQueryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('convertPrimeNGMatchModeToFilterOperator', () => {
    it('should convert CONTAINS to ILIKE', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator(
          FilterMatchMode.CONTAINS,
        ),
      ).toBe(FilterOperator.ILIKE);
    });

    it('should convert EQUALS to EQ', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator(FilterMatchMode.EQUALS),
      ).toBe(FilterOperator.EQ);
    });

    it('should convert IN to IN', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator(FilterMatchMode.IN),
      ).toBe(FilterOperator.IN);
    });

    it('should convert GREATER_THAN to GT', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator(
          FilterMatchMode.GREATER_THAN,
        ),
      ).toBe(FilterOperator.GT);
    });

    it('should convert LESS_THAN to LT', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator(
          FilterMatchMode.LESS_THAN,
        ),
      ).toBe(FilterOperator.LT);
    });

    it('should convert EQUALS to BTW for dates', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator(
          FilterMatchMode.EQUALS,
          true,
        ),
      ).toBe(FilterOperator.BTW);
    });

    it('should default to ILIKE', () => {
      // @ts-expect-error accessing a private method for unit testing purposes
      expect(service.convertPrimeNGMatchModeToFilterOperator(undefined)).toBe(
        FilterOperator.ILIKE,
      );
    });
  });

  describe('convertPrimeNGFilterMetadataToValueAndOperator', () => {
    it('should convert filter metadata to value and operator', () => {
      const filterMetadata: FilterMetadata = {
        value: 'test',
        matchMode: FilterMatchMode.CONTAINS,
      };
      const result =
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGFilterMetadataToValueAndOperator(filterMetadata);
      expect(result).toEqual({ value: 'test', operator: FilterOperator.ILIKE });
    });

    it('should return undefined for empty filter', () => {
      const result =
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGFilterMetadataToValueAndOperator(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle BETWEEN operator for dates', () => {
      const filterMetadata: FilterMetadata = {
        value: new Date('2025-04-03T12:00:00Z'),
        matchMode: FilterMatchMode.EQUALS,
      };
      const result =
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGFilterMetadataToValueAndOperator(filterMetadata);
      expect(result).toEqual({
        value: '2025-04-03T00:00:00.000Z,2025-04-03T23:59:59.999Z',
        operator: FilterOperator.BTW,
      });
    });
  });

  describe('convertPrimeNGLazyLoadFilterToPaginateFilter', () => {
    it('should convert lazy load filters to paginate filters', () => {
      const filters = {
        name: { value: 'test', matchMode: FilterMatchMode.CONTAINS },
      };
      const result =
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGLazyLoadFilterToPaginateFilter(filters);
      expect(result).toEqual({ filter: { name: '$ilike:test' } });
    });

    it('should handle global search', () => {
      const filters = {
        global: { value: 'search', matchMode: FilterMatchMode.CONTAINS },
      };
      const result =
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGLazyLoadFilterToPaginateFilter(filters);
      expect(result).toEqual({ search: 'search' });
    });
  });

  describe('convertPrimeNGLazyLoadEventToPaginateQuery', () => {
    it('should convert lazy load event to paginate query', () => {
      const event: TableLazyLoadEvent = {
        first: 0,
        rows: 10,
        filters: {
          name: { value: 'test', matchMode: FilterMatchMode.CONTAINS },
        },
        sortField: 'name',
        sortOrder: 1,
      };
      const result = service.convertPrimeNGLazyLoadEventToPaginateQuery(event);
      expect(result).toEqual({
        page: 1,
        limit: 10,
        sortBy: [['name', 'ASC']],
        filter: { name: '$ilike:test' },
        search: undefined,
      });
    });

    it('should throw error for invalid event', () => {
      const event: TableLazyLoadEvent = {
        first: undefined,
        rows: undefined,
        filters: {},
      };
      expect(() =>
        service.convertPrimeNGLazyLoadEventToPaginateQuery(event),
      ).toThrowError('An unexpected error occurred');
    });
  });

  describe('paginateQueryToHttpParamsObject', () => {
    it('should convert an empty query to HttpParamsObject', () => {
      const result = service.paginateQueryToHttpParamsObject();
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('');
    });

    it('should convert a query with page and limit to HttpParamsObject', () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('page=1&limit=10');
    });

    it('should convert a query with sortBy to HttpParamsObject', () => {
      const query: PaginateQuery = {
        sortBy: [['name', 'ASC']],
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('sortBy=name:ASC');
    });

    it('should convert a query with search to HttpParamsObject', () => {
      const query: PaginateQuery = {
        search: 'test',
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('search=test');
    });

    it('should convert a query with filter to HttpParamsObject', () => {
      const query: PaginateQuery = {
        filter: {
          name: '$ilike:test',
        },
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('filter.name=$ilike:test');
    });

    it('should convert a query with select to HttpParamsObject', () => {
      const query: PaginateQuery = {
        select: ['name', 'age'],
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('select=name,age');
    });

    it('should convert a complex query to HttpParamsObject', () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['name', 'ASC']],
        search: 'test',
        filter: {
          name: '$ilike:test',
        },
        select: ['name', 'age'],
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe(
        'page=1&limit=10&sortBy=name:ASC&search=test&filter.name=$ilike:test&select=name,age',
      );
    });

    it('should handle array filters correctly', () => {
      const query: PaginateQuery = {
        filter: {
          name: ['$ilike:test1', '$ilike:test2'],
        },
      };
      const result = service.paginateQueryToHttpParamsObject(query);
      const params = new HttpParams({ fromObject: result });
      expect(params.toString()).toBe('filter.name=$ilike:test1,$ilike:test2');
    });
  });

  describe('getDateFilterValue', () => {
    it('should return start and end of the day for EQUALS match mode', () => {
      const date = new Date('2025-04-03T12:00:00Z');
      const expectedStartOfDay = startOfDay(date).toISOString();
      const expectedEndOfDay = endOfDay(date).toISOString();

      // @ts-expect-error accessing a private method for unit testing purposes
      const result = service.getDateFilterValue(date, FilterMatchMode.EQUALS);
      expect(result).toBe(`${expectedStartOfDay},${expectedEndOfDay}`);
    });

    it('should return end of the day for GREATER_THAN match mode', () => {
      const date = new Date('2025-04-03T12:00:00Z');
      const expectedEndOfDay = endOfDay(date).toISOString();

      // @ts-expect-error accessing a private method for unit testing purposes
      const result = service.getDateFilterValue(
        date,
        FilterMatchMode.GREATER_THAN,
      );
      expect(result).toBe(expectedEndOfDay);
    });

    it('should return start of the day for LESS_THAN match mode', () => {
      const date = new Date('2025-04-03T12:00:00Z');
      const expectedStartOfDay = startOfDay(date).toISOString();

      // @ts-expect-error accessing a private method for unit testing purposes
      const result = service.getDateFilterValue(
        date,
        FilterMatchMode.LESS_THAN,
      );
      expect(result).toBe(expectedStartOfDay);
    });
  });
});

import { TestBed } from '@angular/core/testing';

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

  describe('paginateQueryToHttpParams', () => {
    it('should convert an empty query to HttpParams', () => {
      const result = service.paginateQueryToHttpParams();
      expect(result.toString()).toBe('');
    });

    it('should convert a query with page and limit to HttpParams', () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
      };
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe('page=1&limit=10');
    });

    it('should convert a query with sortBy to HttpParams', () => {
      const query: PaginateQuery = {
        sortBy: [['name', 'ASC']],
      };
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe('sortBy=name:ASC');
    });

    it('should convert a query with search to HttpParams', () => {
      const query: PaginateQuery = {
        search: 'test',
      };
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe('search=test');
    });

    it('should convert a query with filter to HttpParams', () => {
      const query: PaginateQuery = {
        filter: {
          name: '$ilike:test',
        },
      };
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe('filter.name=$ilike:test');
    });

    it('should convert a query with select to HttpParams', () => {
      const query: PaginateQuery = {
        select: ['name', 'age'],
      };
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe('select=name&select=age');
    });

    it('should convert a complex query to HttpParams', () => {
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
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe(
        'page=1&limit=10&sortBy=name:ASC&search=test&filter.name=$ilike:test&select=name&select=age',
      );
    });

    it('should handle array filters correctly', () => {
      const query: PaginateQuery = {
        filter: {
          name: ['$ilike:test1', '$ilike:test2'],
        },
      };
      const result = service.paginateQueryToHttpParams(query);
      expect(result.toString()).toBe(
        'filter.name=$ilike:test1&filter.name=$ilike:test2',
      );
    });
  });
});

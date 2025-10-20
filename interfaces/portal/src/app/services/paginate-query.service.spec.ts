import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { FilterMatchMode, FilterMetadata } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

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

  describe('extendStatusFilterToExcludeDeleted', () => {
    const expectedDeletedStatusExclusion = `${FilterOperator.NOT}:${RegistrationStatusEnum.deleted}`;

    it('should return `$not:deleted` when no current filter is provided', () => {
      const result = service.extendStatusFilterToExcludeDeleted(undefined);
      expect(result).toBe(expectedDeletedStatusExclusion);
    });
    it('should add `$not:deleted` when a single filter is provided', () => {
      const testFilter = `${FilterOperator.IN}:${RegistrationStatusEnum.included}`;
      const result = service.extendStatusFilterToExcludeDeleted(testFilter);
      expect(result).toBe(`${testFilter},${expectedDeletedStatusExclusion}`);
    });
    it('should add `$not:deleted` ONLY when its not already provided', () => {
      const testFilter = `${expectedDeletedStatusExclusion},${FilterOperator.IN}:${RegistrationStatusEnum.included}`;
      const result = service.extendStatusFilterToExcludeDeleted(testFilter);
      expect(result).toBe(testFilter);
    });
    it('should add `$not:deleted` when a few filters are provided', () => {
      const testFilter = [
        `${FilterOperator.IN}:${RegistrationStatusEnum.included},${RegistrationStatusEnum.validated}`,
        `${FilterOperator.NOT}:${RegistrationStatusEnum.paused}`,
      ];
      const result = service.extendStatusFilterToExcludeDeleted(testFilter);
      expect(result).toBe(
        `${FilterOperator.IN}:${RegistrationStatusEnum.included},${RegistrationStatusEnum.validated},${FilterOperator.NOT}:${RegistrationStatusEnum.paused},${expectedDeletedStatusExclusion}`,
      );
    });
    it('should add `$not:deleted` when a single filter is provided (as an array)', () => {
      const testFilter = [
        `${FilterOperator.NOT}:${RegistrationStatusEnum.paused}`,
      ];
      const result = service.extendStatusFilterToExcludeDeleted(testFilter);
      expect(result).toBe(
        `${FilterOperator.NOT}:${RegistrationStatusEnum.paused},${expectedDeletedStatusExclusion}`,
      );
    });
    it('should add `$not:deleted` ONLY when not already amongst the few filters provided', () => {
      const testFilter = [
        `${FilterOperator.IN}:${RegistrationStatusEnum.included},${RegistrationStatusEnum.validated}`,
        expectedDeletedStatusExclusion,
        `${FilterOperator.NOT}:${RegistrationStatusEnum.paused}`,
      ];
      const result = service.extendStatusFilterToExcludeDeleted(testFilter);
      expect(result).toBe(
        `${FilterOperator.IN}:${RegistrationStatusEnum.included},${RegistrationStatusEnum.validated},${expectedDeletedStatusExclusion},${FilterOperator.NOT}:${RegistrationStatusEnum.paused}`,
      );
    });
  });

  describe('convertPrimeNGMatchModeToFilterOperator', () => {
    it('should convert CONTAINS to ILIKE', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.CONTAINS,
        }),
      ).toBe(FilterOperator.ILIKE);
    });

    it('should convert EQUALS to EQ', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.EQUALS,
        }),
      ).toBe(FilterOperator.EQ);
    });

    it('should convert NOT_EQUALS to NOT', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.NOT_EQUALS,
        }),
      ).toBe(FilterOperator.NOT);
    });

    it('should convert IN to IN', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.IN,
        }),
      ).toBe(FilterOperator.IN);
    });

    it('should convert GREATER_THAN to GT', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.GREATER_THAN,
        }),
      ).toBe(FilterOperator.GT);
    });

    it('should convert LESS_THAN to LT', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.LESS_THAN,
        }),
      ).toBe(FilterOperator.LT);
    });

    it('should convert EQUALS to BTW for dates', () => {
      expect(
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.EQUALS,
          isDate: true,
        }),
      ).toBe(FilterOperator.BTW);
    });

    it('should default to ILIKE when matchMode is not provided', () => {
      // @ts-expect-error accessing a private method for unit testing purposes
      expect(service.convertPrimeNGMatchModeToFilterOperator({})).toBe(
        FilterOperator.ILIKE,
      );
    });

    it('should throw an error for an unsupported match mode', () => {
      expect(() =>
        // @ts-expect-error accessing a private method for unit testing purposes
        service.convertPrimeNGMatchModeToFilterOperator({
          matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
        }),
      ).toThrowError('Unsupported match mode: gte');
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

      expect(result).toBeDefined();

      // Early return if result is undefined (won't happen due to the expect above, but makes TypeScript happy)
      if (!result) return;

      // Check operator is correct
      expect(result.operator).toBe(FilterOperator.BTW);

      // Check value is comma-separated string containing two valid ISO dates
      const dateStrings = result.value.split(',');
      expect(dateStrings.length).toBe(2);

      // Validate both are valid ISO date strings
      const startDate = new Date(dateStrings[0]);
      const endDate = new Date(dateStrings[1]);
      expect(startDate.toISOString()).toBe(dateStrings[0]);
      expect(endDate.toISOString()).toBe(dateStrings[1]);
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
    it('should return start and end of the day of the local timezone converted to UTC for EQUALS match mode', () => {
      const date = new Date('2025-04-03T12:00:00Z');

      // Calculate expected start and end of the day in UTC
      const clientTimeZoneOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
      const startOfDayLocal = new Date(date.setHours(0, 0, 0, 0));
      const endOfDayLocal = new Date(date.setHours(23, 59, 59, 999));
      const expectedStartOfDayUtc = new Date(
        startOfDayLocal.getTime() + clientTimeZoneOffset,
      ).toISOString();
      const expectedEndOfDayUtc = new Date(
        endOfDayLocal.getTime() + clientTimeZoneOffset,
      ).toISOString();

      // @ts-expect-error accessing a private method for unit testing purposes
      const result = service.getDateFilterValue(date, FilterMatchMode.EQUALS);
      expect(result).toBe(`${expectedStartOfDayUtc},${expectedEndOfDayUtc}`);
    });

    it('should return start of the day of the local timezone converted to UTC for GREATER_THAN match mode', () => {
      const date = new Date('2025-04-03T12:00:00Z');

      // Calculate expected start of the day in UTC
      const clientTimeZoneOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds

      const endOfDayLocal = new Date(date.setHours(23, 59, 59, 999));
      const expectedEndOfDayUtc = new Date(
        endOfDayLocal.getTime() + clientTimeZoneOffset,
      ).toISOString();

      // @ts-expect-error accessing a private method for unit testing purposes
      const result = service.getDateFilterValue(
        date,
        FilterMatchMode.GREATER_THAN,
      );
      expect(result).toBe(expectedEndOfDayUtc);
    });

    it('should return end of the day of the local timezone converted to UTC for LESS_THAN match mode', () => {
      const date = new Date('2025-04-03T12:00:00Z');

      // Calculate expected end of the day in UTC
      const clientTimeZoneOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds

      const startOfDayLocal = new Date(date.setHours(0, 0, 0, 0));
      const expectedStartOfDayUtc = new Date(
        startOfDayLocal.getTime() + clientTimeZoneOffset,
      ).toISOString();

      // @ts-expect-error accessing a private method for unit testing purposes
      const result = service.getDateFilterValue(
        date,
        FilterMatchMode.LESS_THAN,
      );
      expect(result).toBe(expectedStartOfDayUtc);
    });
  });
});

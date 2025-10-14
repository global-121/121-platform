import { TestBed } from '@angular/core/testing';
import { TableLazyLoadEvent } from 'primeng/table';

import { QueryTablePaginationService } from './query-table-pagination.service';
import { PaginateQuery, PaginateQueryService } from '~/services/paginate-query.service';

type TestData = { id: number; name: string; value: number };

describe('QueryTablePaginationService', () => {
  let service: QueryTablePaginationService<TestData>;
  let paginateQueryService: jasmine.SpyObj<PaginateQueryService>;

  beforeEach(() => {
    const paginateQueryServiceSpy = jasmine.createSpyObj('PaginateQueryService', [
      'convertPrimeNGLazyLoadEventToPaginateQuery'
    ]);

    TestBed.configureTestingModule({
      providers: [
        QueryTablePaginationService,
        { provide: PaginateQueryService, useValue: paginateQueryServiceSpy },
      ],
    });

    service = TestBed.inject(QueryTablePaginationService);
    paginateQueryService = TestBed.inject(PaginateQueryService) as jasmine.SpyObj<PaginateQueryService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('total records calculation', () => {
    const testItems: TestData[] = [
      { id: 1, name: 'Item 1', value: 10 },
      { id: 2, name: 'Item 2', value: 20 },
      { id: 3, name: 'Item 3', value: 30 },
    ];

    it('should return item count for client-side filtering', () => {
      // Act: Get total records with client-side filtering
      const totalRecordsFunction = service.totalRecords();
      const result = totalRecordsFunction(testItems, false);

      // Assert: Should return the actual item count
      expect(result).toBe(3);
    });

    it('should return server-side count when server-side filtering is enabled', () => {
      // Arrange: Set up server-side total records provider
      service.setServerSideTotalRecordsProvider(() => 150);

      // Act: Get total records with server-side filtering
      const totalRecordsFunction = service.totalRecords();
      const result = totalRecordsFunction(testItems, true);

      // Assert: Should return server-side count, not item count
      expect(result).toBe(150);
    });

    it('should throw error when server-side filtering enabled but no total records provider set', () => {
      // Act & Assert: Should throw error when server-side filtering enabled without provider
      const totalRecordsFunction = service.totalRecords();
      expect(() => totalRecordsFunction(testItems, true)).toThrow('Server side filtering requires totalRecords to be set');
    });

    it('should throw error when server-side total records provider returns undefined', () => {
      // Arrange: Set up provider that returns undefined
      service.setServerSideTotalRecordsProvider(() => undefined);

      // Act & Assert: Should throw error when provider returns undefined
      const totalRecordsFunction = service.totalRecords();
      expect(() => totalRecordsFunction(testItems, true)).toThrow('Server side filtering requires totalRecords to be set');
    });

    it('should handle empty item arrays', () => {
      // Act: Get total records with empty array
      const totalRecordsFunction = service.totalRecords();
      const result = totalRecordsFunction([], false);

      // Assert: Should return 0 for empty arrays
      expect(result).toBe(0);
    });
  });

  describe('current page report template generation', () => {
    it('should return base template when no selected items', () => {
      // Act: Get page report template without selection
      const templateFunction = service.currentPageReportTemplate();
      const result = templateFunction(undefined);

      // Assert: Should return base template with curly braces
      expect(result).toBe('Showing {first} to {last} of {totalRecords} records');
    });

    it('should return base template when selected items count is 0', () => {
      // Act: Get page report template with 0 selection
      const templateFunction = service.currentPageReportTemplate();
      const result = templateFunction(0);

      // Assert: Should return base template without selection info
      expect(result).toBe('Showing {first} to {last} of {totalRecords} records');
    });

    it('should include selection count when items are selected', () => {
      // Act: Get page report template with selection
      const templateFunction = service.currentPageReportTemplate();
      const result = templateFunction(5);

      // Assert: Should include selection count in template
      expect(result).toBe('Showing {first} to {last} of {totalRecords} records (5 selected)');
    });

    it('should handle large selection counts', () => {
      // Act: Get page report template with large selection
      const templateFunction = service.currentPageReportTemplate();
      const result = templateFunction(1000);

      // Assert: Should handle large numbers correctly
      expect(result).toBe('Showing {first} to {last} of {totalRecords} records (1000 selected)');
    });

    it('should convert square brackets to curly braces correctly', () => {
      // Act: Get page report template
      const templateFunction = service.currentPageReportTemplate();
      const result = templateFunction();

      // Assert: Should convert all square brackets to curly braces
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
      expect(result).toContain('{first}');
      expect(result).toContain('{last}');
      expect(result).toContain('{totalRecords}');
    });
  });

  describe('lazy load event handling', () => {
    const mockLazyLoadEvent: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortField: 'name',
      sortOrder: 1,
      filters: { name: { value: 'test', matchMode: 'contains' } },
    };

    const mockPaginateQuery: PaginateQuery = {
      page: 1,
      limit: 10,
      sortBy: [['name', 'ASC']],
      filter: { name: { $contains: 'test' } },
    };

    beforeEach(() => {
      paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery.and.returnValue(mockPaginateQuery);
    });

    it('should process lazy load events and call update callback', () => {
      // Arrange: Mock update callback
      const updateCallback = jasmine.createSpy('updateCallback');

      // Act: Handle lazy load event
      service.onLazyLoadEvent(mockLazyLoadEvent, updateCallback);

      // Assert: Should convert event and call update callback
      expect(paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery).toHaveBeenCalledWith(mockLazyLoadEvent);
      expect(updateCallback).toHaveBeenCalledWith(mockPaginateQuery);
    });

    it('should not call update callback when conversion returns null', () => {
      // Arrange: Mock conversion to return null
      paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery.and.returnValue(null);
      const updateCallback = jasmine.createSpy('updateCallback');

      // Act: Handle lazy load event
      service.onLazyLoadEvent(mockLazyLoadEvent, updateCallback);

      // Assert: Should not call update callback when conversion returns null
      expect(paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery).toHaveBeenCalledWith(mockLazyLoadEvent);
      expect(updateCallback).not.toHaveBeenCalled();
    });

    it('should handle multiple lazy load events', () => {
      // Arrange: Multiple events and callback
      const updateCallback = jasmine.createSpy('updateCallback');
      const secondEvent = { ...mockLazyLoadEvent, first: 10, rows: 10 };
      const secondQuery = { ...mockPaginateQuery, page: 2 };

      // First event
      service.onLazyLoadEvent(mockLazyLoadEvent, updateCallback);

      // Second event
      paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery.and.returnValue(secondQuery);
      service.onLazyLoadEvent(secondEvent, updateCallback);

      // Assert: Should handle both events
      expect(updateCallback).toHaveBeenCalledTimes(2);
      expect(updateCallback).toHaveBeenCalledWith(mockPaginateQuery);
      expect(updateCallback).toHaveBeenCalledWith(secondQuery);
    });
  });

  describe('server side total records provider', () => {
    it('should set and use server side total records provider', () => {
      // Arrange: Set up provider
      const provider = jasmine.createSpy('provider').and.returnValue(200);
      service.setServerSideTotalRecordsProvider(provider);

      // Act: Use total records function
      const totalRecordsFunction = service.totalRecords();
      const result = totalRecordsFunction([], true);

      // Assert: Should use the provider
      expect(provider).toHaveBeenCalled();
      expect(result).toBe(200);
    });

    it('should allow provider to be updated', () => {
      // Arrange: Set initial provider
      const firstProvider = jasmine.createSpy('firstProvider').and.returnValue(100);
      const secondProvider = jasmine.createSpy('secondProvider').and.returnValue(300);

      service.setServerSideTotalRecordsProvider(firstProvider);
      
      // Act: Update provider
      service.setServerSideTotalRecordsProvider(secondProvider);

      // Use total records function
      const totalRecordsFunction = service.totalRecords();
      const result = totalRecordsFunction([], true);

      // Assert: Should use the updated provider
      expect(firstProvider).not.toHaveBeenCalled();
      expect(secondProvider).toHaveBeenCalled();
      expect(result).toBe(300);
    });

    it('should handle provider that returns different values over time', () => {
      // Arrange: Provider that returns different values
      let count = 100;
      const dynamicProvider = jasmine.createSpy('dynamicProvider').and.callFake(() => {
        count += 50;
        return count;
      });
      service.setServerSideTotalRecordsProvider(dynamicProvider);

      // Act: Call total records multiple times
      const totalRecordsFunction = service.totalRecords();
      const result1 = totalRecordsFunction([], true);
      const result2 = totalRecordsFunction([], true);

      // Assert: Should get different values from dynamic provider
      expect(result1).toBe(150); // 100 + 50
      expect(result2).toBe(200); // 150 + 50
      expect(dynamicProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('computed signal behavior', () => {
    it('should return functions that can be called multiple times', () => {
      // Act: Get computed functions
      const totalRecordsFunction = service.totalRecords();
      const templateFunction = service.currentPageReportTemplate();

      // Assert: Functions should be callable multiple times
      expect(typeof totalRecordsFunction).toBe('function');
      expect(typeof templateFunction).toBe('function');

      // Should not throw when called multiple times
      expect(() => {
        totalRecordsFunction([], false);
        totalRecordsFunction([], false);
        templateFunction(0);
        templateFunction(5);
      }).not.toThrow();
    });
  });
});
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method -- Test file requires any types for mocking */
import { TestBed } from '@angular/core/testing';

import { QueryTablePaginationService } from '~/components/query-table/services/query-table-pagination.service';
import { PaginateQueryService } from '~/services/paginate-query.service';

describe('QueryTablePaginationService', () => {
  let service: QueryTablePaginationService<any>;
  let paginateQueryService: jasmine.SpyObj<PaginateQueryService>;

  beforeEach(() => {
    const paginateQueryServiceSpy = jasmine.createSpyObj(
      'PaginateQueryService',
      ['convertPrimeNGLazyLoadEventToPaginateQuery'],
    );

    TestBed.configureTestingModule({
      providers: [
        QueryTablePaginationService,
        { provide: PaginateQueryService, useValue: paginateQueryServiceSpy },
      ],
    });

    service = TestBed.inject(QueryTablePaginationService);
    paginateQueryService = TestBed.inject(
      PaginateQueryService,
    ) as jasmine.SpyObj<PaginateQueryService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return item count for client-side filtering', () => {
    const testItems = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ];

    const totalRecordsFunction = service.totalRecords();
    const result = totalRecordsFunction(testItems, false);

    expect(result).toBe(3);
  });

  it('should return server-side count when server-side filtering is enabled', () => {
    service.setServerSideTotalRecordsProvider(() => 150);

    const totalRecordsFunction = service.totalRecords();
    const result = totalRecordsFunction([], true);

    expect(result).toBe(150);
  });

  it('should throw error when server-side filtering enabled but no total records provider set', () => {
    const totalRecordsFunction = service.totalRecords();

    expect(() => totalRecordsFunction([], true)).toThrow(
      'Server side filtering requires totalRecords to be set',
    );
  });

  it('should return base template when no selected items', () => {
    const templateFunction = service.currentPageReportTemplate();
    const result = templateFunction(undefined);

    expect(result).toBe('Showing {first} to {last} of {totalRecords} records');
  });

  it('should include selection count when items are selected', () => {
    const templateFunction = service.currentPageReportTemplate();
    const result = templateFunction(5);

    expect(result).toBe(
      'Showing {first} to {last} of {totalRecords} records (5 selected)',
    );
  });

  it('should process lazy load events and call update callback', () => {
    const mockLazyLoadEvent: any = {
      first: 0,
      rows: 10,
      sortField: 'name',
      sortOrder: 1,
    };

    const mockPaginateQuery: any = {
      page: 1,
      limit: 10,
      sortBy: [['name', 'ASC']],
    };

    paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery.and.returnValue(
      mockPaginateQuery,
    );
    const updateCallback = jasmine.createSpy('updateCallback');

    service.onLazyLoadEvent(mockLazyLoadEvent, updateCallback);

    expect(
      paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery,
    ).toHaveBeenCalledWith(mockLazyLoadEvent);
    expect(updateCallback).toHaveBeenCalledWith(mockPaginateQuery);
  });

  it('should not call update callback when conversion returns undefined', () => {
    const mockLazyLoadEvent: any = { first: 0, rows: 10 };
    paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery.and.returnValue(
      undefined,
    );
    const updateCallback = jasmine.createSpy('updateCallback');

    service.onLazyLoadEvent(mockLazyLoadEvent, updateCallback);

    expect(updateCallback).not.toHaveBeenCalled();
  });
});

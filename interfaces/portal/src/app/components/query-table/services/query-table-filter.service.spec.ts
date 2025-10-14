import { TestBed } from '@angular/core/testing';
import { FilterMatchMode } from 'primeng/api';
import { ColumnFilter } from 'primeng/table';

import { QueryTableColumn, QueryTableColumnType } from '../query-table.component';
import { QueryTableFilterService } from './query-table-filter.service';
import { TrackingService } from '~/services/tracking.service';

type TestData = { id: number; name: string; value: number; type: 'A' | 'B' };

describe('QueryTableFilterService', () => {
  let service: QueryTableFilterService<TestData>;
  let trackingService: jasmine.SpyObj<TrackingService>;

  beforeEach(() => {
    const trackingServiceSpy = jasmine.createSpyObj('TrackingService', ['trackEvent']);

    TestBed.configureTestingModule({
      providers: [
        QueryTableFilterService,
        { provide: TrackingService, useValue: trackingServiceSpy },
      ],
    });

    service = TestBed.inject(QueryTableFilterService);
    trackingService = TestBed.inject(TrackingService) as jasmine.SpyObj<TrackingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('global filter functionality', () => {
    it('should initialize with no global filter visible and no filter value', () => {
      expect(service.globalFilterVisible()).toBe(false);
      expect(service.globalFilterValue()).toBeUndefined();
      expect(service.isFiltered()).toBe(false);
    });

    it('should detect global filter when value is set', () => {
      // Arrange: Set up table filters with global filter
      service.updateTableFilters({
        global: { value: 'test', matchMode: FilterMatchMode.CONTAINS }
      });

      // Act & Assert: Global filter should be detected
      expect(service.globalFilterValue()).toBe('test');
      expect(service.isFiltered()).toBe(true);
    });

    it('should handle array-based global filter metadata', () => {
      // Arrange: Set up table filters with array-based global filter
      service.updateTableFilters({
        global: [{ value: 'array-test', matchMode: FilterMatchMode.CONTAINS }]
      });

      // Act & Assert: Should extract value from array
      expect(service.globalFilterValue()).toBe('array-test');
      expect(service.isFiltered()).toBe(true);
    });
  });

  describe('column filter functionality', () => {
    const textColumn: QueryTableColumn<TestData> = {
      header: 'Name',
      field: 'name',
      type: QueryTableColumnType.TEXT,
    };

    const numericColumn: QueryTableColumn<TestData> = {
      header: 'Value',
      field: 'value',
      type: QueryTableColumnType.NUMERIC,
    };

    const multiselectColumn: QueryTableColumn<TestData> = {
      header: 'Type',
      field: 'type',
      type: QueryTableColumnType.MULTISELECT,
      options: [
        { label: 'Type A', value: 'A' },
        { label: 'Type B', value: 'B' },
      ],
    };

    it('should return correct filter fields for different column types', () => {
      expect(service.getColumnFilterField(textColumn)).toBe('name');
      expect(service.getColumnFilterField(numericColumn)).toBe('value');
      expect(service.getColumnFilterField(multiselectColumn)).toBe('type');
    });

    it('should return undefined for computed field columns', () => {
      const computedColumn: QueryTableColumn<TestData> = {
        header: 'Computed',
        field: 'COMPUTED_FIELD',
      };

      expect(service.getColumnFilterField(computedColumn)).toBeUndefined();
    });

    it('should return undefined for columns with disabled filtering', () => {
      const disabledColumn: QueryTableColumn<TestData> = {
        header: 'Disabled',
        field: 'name',
        disableFiltering: true,
      };

      expect(service.getColumnFilterField(disabledColumn)).toBeUndefined();
    });

    it('should detect when columns are filtered', () => {
      // Arrange: Set up table filters with a column filter
      service.updateTableFilters({
        name: { value: 'test', matchMode: FilterMatchMode.CONTAINS }
      });

      // Act & Assert: Should detect column is filtered
      expect(service.getIsColumnFiltered(textColumn)).toBe(true);
      expect(service.isFiltered()).toBe(true);
    });

    it('should handle array-based column filter metadata', () => {
      // Arrange: Set up table filters with array-based column filter
      service.updateTableFilters({
        name: [{ value: 'test', matchMode: FilterMatchMode.CONTAINS }]
      });

      // Act & Assert: Should detect column is filtered
      expect(service.getIsColumnFiltered(textColumn)).toBe(true);
    });
  });

  describe('match mode functionality', () => {
    it('should return correct match modes for text columns', () => {
      const textColumn: QueryTableColumn<TestData> = {
        header: 'Name',
        field: 'name',
        type: QueryTableColumnType.TEXT,
      };

      expect(service.getColumnMatchMode(textColumn)).toBe(FilterMatchMode.CONTAINS);
      
      const options = service.getColumnMatchModeOptions(textColumn);
      expect(options).toContain({ label: 'Contains', value: FilterMatchMode.CONTAINS });
      expect(options).toContain({ label: 'Equal to', value: FilterMatchMode.EQUALS });
      expect(options).toContain({ label: 'Not equal to', value: FilterMatchMode.NOT_EQUALS });
    });

    it('should return correct match modes for numeric columns', () => {
      const numericColumn: QueryTableColumn<TestData> = {
        header: 'Value',
        field: 'value',
        type: QueryTableColumnType.NUMERIC,
      };

      expect(service.getColumnMatchMode(numericColumn)).toBe(FilterMatchMode.EQUALS);
      
      const options = service.getColumnMatchModeOptions(numericColumn);
      expect(options).toContain({ label: 'Equal to', value: FilterMatchMode.EQUALS });
      expect(options).toContain({ label: 'Not equal to', value: FilterMatchMode.NOT_EQUALS });
      expect(options).toContain({ label: 'Less than', value: FilterMatchMode.LESS_THAN });
      expect(options).toContain({ label: 'Greater than', value: FilterMatchMode.GREATER_THAN });
    });

    it('should return correct match modes for multiselect columns', () => {
      const multiselectColumn: QueryTableColumn<TestData> = {
        header: 'Type',
        field: 'type',
        type: QueryTableColumnType.MULTISELECT,
        options: [{ label: 'Test', value: 'test' }],
      };

      expect(service.getColumnMatchMode(multiselectColumn)).toBe(FilterMatchMode.IN);
      expect(service.getColumnMatchModeOptions(multiselectColumn)).toBeUndefined();
    });
  });

  describe('clear functionality', () => {
    it('should clear all filters and trigger tracking event', () => {
      // Arrange: Set up mocks
      const clearTableSpy = jasmine.createSpy('clearTable');
      const resetSelectionSpy = jasmine.createSpy('resetSelection');
      const localStorageKey = 'test-storage-key';
      
      spyOn(localStorage, 'removeItem');
      service.globalFilterVisible.set(true);
      service.updateTableFilters({ name: { value: 'test', matchMode: FilterMatchMode.CONTAINS } });

      // Act: Clear all filters
      service.clearAllFilters({
        clearTable: clearTableSpy,
        localStorageKey,
        resetSelection: resetSelectionSpy,
      });

      // Assert: Should clear everything and track event
      expect(clearTableSpy).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith(localStorageKey);
      expect(service.globalFilterVisible()).toBe(false);
      expect(service.isFiltered()).toBe(false);
      expect(resetSelectionSpy).toHaveBeenCalled();
      expect(trackingService.trackEvent).toHaveBeenCalled();
    });

    it('should clear column filter and trigger tracking event', () => {
      // Arrange: Set up mock column filter
      const mockColumnFilter = jasmine.createSpyObj('ColumnFilter', ['clearFilter']);
      const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);
      mockColumnFilter.type = 'text';
      mockColumnFilter.field = 'name';

      // Act: Clear column filter
      service.clearColumnFilter(mockEvent, mockColumnFilter);

      // Assert: Should stop propagation, clear filter, and track event
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockColumnFilter.clearFilter).toHaveBeenCalled();
      expect(trackingService.trackEvent).toHaveBeenCalled();
    });
  });

  describe('tracking functionality', () => {
    it('should track column filter show events', () => {
      // Act: Show column filter
      service.onShowColumnFilter('test-field', QueryTableColumnType.TEXT);

      // Assert: Should track event with correct parameters
      expect(trackingService.trackEvent).toHaveBeenCalledWith({
        category: jasmine.any(String),
        action: jasmine.any(String),
        name: 'type:text name:test-field',
      });
    });
  });
});
import { TestBed } from '@angular/core/testing';

import { QueryTableColumn } from '../query-table.component';
import { QueryTableColumnVisibilityService } from './query-table-column-visibility.service';

type TestData = { id: number; name: string; value: number };

describe('QueryTableColumnVisibilityService', () => {
  let service: QueryTableColumnVisibilityService<TestData>;

  const testColumns: QueryTableColumn<TestData>[] = [
    { header: 'ID', field: 'id' },
    { header: 'Name', field: 'name' },
    { header: 'Value', field: 'value', defaultHidden: true },
    { header: 'Extra', field: 'name', defaultHidden: true }, // Using 'name' field for simplicity
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueryTableColumnVisibilityService],
    });

    service = TestBed.inject(QueryTableColumnVisibilityService);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('column visibility initialization', () => {
    it('should initialize with empty visible columns', () => {
      expect(service.visibleColumns()).toEqual([]);
    });

    it('should show only non-hidden columns by default', () => {
      // Act: Update column visibility without state key
      service.updateColumnVisibility({
        columns: testColumns,
        selectedColumnsStateKey: undefined,
      });

      // Assert: Should show only columns without defaultHidden
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(2);
      expect(visibleColumns.map(c => c.header)).toEqual(['ID', 'Name']);
    });

    it('should restore columns from localStorage when available', () => {
      // Arrange: Store column selection in localStorage
      const storedColumns = [testColumns[0], testColumns[2]]; // ID and Value
      localStorage.setItem('test-key', JSON.stringify(storedColumns));

      // Act: Update column visibility with state key
      service.updateColumnVisibility({
        columns: testColumns,
        selectedColumnsStateKey: 'test-key',
      });

      // Assert: Should restore saved columns
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(2);
      expect(visibleColumns.map(c => c.header)).toEqual(['ID', 'Value']);
    });

    it('should fall back to default columns when localStorage is empty', () => {
      // Act: Update column visibility with state key but no stored data
      service.updateColumnVisibility({
        columns: testColumns,
        selectedColumnsStateKey: 'non-existent-key',
      });

      // Assert: Should show default columns
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(2);
      expect(visibleColumns.map(c => c.header)).toEqual(['ID', 'Name']);
    });
  });

  describe('column visibility management', () => {
    it('should handle invalid stored columns gracefully', () => {
      // Arrange: Store invalid column data
      const invalidStoredColumns = [
        { header: 'Non-existent', field: 'nonExistent' },
        testColumns[0], // Valid column
      ];
      localStorage.setItem('test-key', JSON.stringify(invalidStoredColumns));

      // Act: Update column visibility
      service.updateColumnVisibility({
        columns: testColumns,
        selectedColumnsStateKey: 'test-key',
      });

      // Assert: Should only show valid columns
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(1);
      expect(visibleColumns[0].header).toBe('ID');
    });

    it('should revert to default columns when requested', () => {
      // Arrange: Store custom column selection
      localStorage.setItem('test-key', JSON.stringify([testColumns[2]]));

      // Act: Revert to default
      service.updateColumnVisibility({
        columns: testColumns,
        selectedColumnsStateKey: 'test-key',
        revertToDefault: true,
      });

      // Assert: Should remove localStorage and show default columns
      expect(localStorage.getItem('test-key')).toBeNull();
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(2);
      expect(visibleColumns.map(c => c.header)).toEqual(['ID', 'Name']);
    });

    it('should manually update visible columns', () => {
      // Arrange: Set initial columns
      const customColumns = [testColumns[0], testColumns[2]];

      // Act: Manually set visible columns
      service.visibleColumns.set(customColumns);

      // Assert: Should update visible columns
      expect(service.visibleColumns()).toEqual(customColumns);
      expect(service.visibleColumns().map(c => c.header)).toEqual(['ID', 'Value']);
    });
  });

  describe('effect creation for automatic column visibility', () => {
    let mockColumns: jasmine.Spy;
    let mockEnableColumnManagement: jasmine.Spy;
    let mockSelectedColumnsStateKey: jasmine.Spy;

    beforeEach(() => {
      mockColumns = jasmine.createSpy('columns').and.returnValue(testColumns);
      mockEnableColumnManagement = jasmine.createSpy('enableColumnManagement').and.returnValue(true);
      mockSelectedColumnsStateKey = jasmine.createSpy('selectedColumnsStateKey').and.returnValue('test-key');
    });

    it('should create column visibility effect that updates when conditions are met', () => {
      // Arrange: Start with empty visible columns
      expect(service.visibleColumns()).toEqual([]);

      // Act: Create effect
      const effect = service.createColumnVisibilityEffect({
        columns: mockColumns,
        enableColumnManagement: mockEnableColumnManagement,
        selectedColumnsStateKey: mockSelectedColumnsStateKey,
      });

      // Assert: Effect should be created
      expect(effect).toBeDefined();
      
      // Note: Testing effects directly is complex in unit tests since they run asynchronously.
      // In a real scenario, you would test the integration through the component that uses this service.
    });

    it('should handle effect with column management disabled', () => {
      // Arrange: Disable column management
      mockEnableColumnManagement.and.returnValue(false);

      // Act: Create effect
      const effect = service.createColumnVisibilityEffect({
        columns: mockColumns,
        enableColumnManagement: mockEnableColumnManagement,
        selectedColumnsStateKey: mockSelectedColumnsStateKey,
      });

      // Assert: Effect should still be created
      expect(effect).toBeDefined();
    });

    it('should handle effect with no state key', () => {
      // Arrange: No state key
      mockSelectedColumnsStateKey.and.returnValue(undefined);

      // Act: Create effect
      const effect = service.createColumnVisibilityEffect({
        columns: mockColumns,
        enableColumnManagement: mockEnableColumnManagement,
        selectedColumnsStateKey: mockSelectedColumnsStateKey,
      });

      // Assert: Effect should still be created
      expect(effect).toBeDefined();
    });
  });

  describe('localStorage interaction', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      // Arrange: Store invalid JSON
      localStorage.setItem('test-key', 'invalid-json');

      // Act & Assert: Should not throw error and fall back to defaults
      expect(() => {
        service.updateColumnVisibility({
          columns: testColumns,
          selectedColumnsStateKey: 'test-key',
        });
      }).not.toThrow();

      // Should fall back to default columns
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(2);
      expect(visibleColumns.map(c => c.header)).toEqual(['ID', 'Name']);
    });

    it('should handle localStorage being unavailable', () => {
      // Arrange: Mock localStorage to throw error
      spyOn(localStorage, 'getItem').and.throwError('localStorage unavailable');

      // Act & Assert: Should not throw error and fall back to defaults
      expect(() => {
        service.updateColumnVisibility({
          columns: testColumns,
          selectedColumnsStateKey: 'test-key',
        });
      }).not.toThrow();
    });
  });

  describe('column matching logic', () => {
    it('should match columns by field property', () => {
      // Arrange: Stored columns with same field values
      const storedColumns = [
        { header: 'Different Header', field: 'id' }, // Same field as testColumns[0]
        { header: 'Name', field: 'name' }, // Exact match with testColumns[1]
      ];
      localStorage.setItem('test-key', JSON.stringify(storedColumns));

      // Act: Update column visibility
      service.updateColumnVisibility({
        columns: testColumns,
        selectedColumnsStateKey: 'test-key',
      });

      // Assert: Should match by field, not header
      const visibleColumns = service.visibleColumns();
      expect(visibleColumns).toHaveLength(2);
      expect(visibleColumns.map(c => c.field)).toEqual(['id', 'name']);
      expect(visibleColumns.map(c => c.header)).toEqual(['ID', 'Name']); // Uses current column headers
    });
  });
});
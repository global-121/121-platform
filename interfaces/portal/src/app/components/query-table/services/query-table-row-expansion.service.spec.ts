import { TestBed } from '@angular/core/testing';

import { QueryTableRowExpansionService } from './query-table-row-expansion.service';

type TestData = { id: number; name: string; value: number };

describe('QueryTableRowExpansionService', () => {
  let service: QueryTableRowExpansionService<TestData>;

  const testItems: TestData[] = [
    { id: 1, name: 'Item 1', value: 10 },
    { id: 2, name: 'Item 2', value: 20 },
    { id: 3, name: 'Item 3', value: 30 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueryTableRowExpansionService],
    });

    service = TestBed.inject(QueryTableRowExpansionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('expansion state management', () => {
    it('should initialize with no expanded rows', () => {
      expect(service.expandedRowKeys()).toEqual({});
      expect(service.areAllRowsExpanded()(testItems)).toBe(false);
    });

    it('should expand all rows when requested', () => {
      // Act: Expand all rows
      service.expandAll(testItems);

      // Assert: All rows should be expanded
      const expandedKeys = service.expandedRowKeys();
      expect(expandedKeys[1]).toBe(true);
      expect(expandedKeys[2]).toBe(true);
      expect(expandedKeys[3]).toBe(true);
      expect(service.areAllRowsExpanded()(testItems)).toBe(true);
    });

    it('should collapse all rows when requested', () => {
      // Arrange: Start with all rows expanded
      service.expandAll(testItems);
      expect(service.areAllRowsExpanded()(testItems)).toBe(true);

      // Act: Collapse all rows
      service.collapseAll();

      // Assert: No rows should be expanded
      expect(service.expandedRowKeys()).toEqual({});
      expect(service.areAllRowsExpanded()(testItems)).toBe(false);
    });

    it('should handle empty item list correctly', () => {
      // Act: Test with empty array
      const emptyItems: TestData[] = [];

      // Assert: Should handle empty array gracefully
      expect(service.areAllRowsExpanded()(emptyItems)).toBe(false);
      
      service.expandAll(emptyItems);
      expect(service.expandedRowKeys()).toEqual({});
    });

    it('should correctly identify partially expanded state', () => {
      // Arrange: Manually expand some rows
      service.updateExpandedRowKeys({
        1: true,
        2: false, // Explicitly false
        // 3 is missing (implicitly false)
      });

      // Assert: Should not consider all rows expanded
      expect(service.areAllRowsExpanded()(testItems)).toBe(false);
    });

    it('should correctly identify all rows expanded state', () => {
      // Arrange: Manually expand all rows
      service.updateExpandedRowKeys({
        1: true,
        2: true,
        3: true,
      });

      // Assert: Should consider all rows expanded
      expect(service.areAllRowsExpanded()(testItems)).toBe(true);
    });
  });

  describe('expanded row keys update', () => {
    it('should update expanded row keys while preserving immutability', () => {
      // Arrange: Original keys
      const originalKeys = { 1: true, 2: false };
      
      // Act: Update expanded row keys
      service.updateExpandedRowKeys(originalKeys);

      // Assert: Should update keys and create a new object
      const updatedKeys = service.expandedRowKeys();
      expect(updatedKeys).toEqual(originalKeys);
      expect(updatedKeys).not.toBe(originalKeys); // Should be a new object
    });

    it('should handle keys with different property key types', () => {
      // Arrange: Test items with string IDs
      const stringIdItems = [
        { id: 'a', name: 'Item A', value: 10 },
        { id: 'b', name: 'Item B', value: 20 },
      ];

      // Act: Expand rows with string keys
      service.expandAll(stringIdItems);

      // Assert: Should work with string keys
      const expandedKeys = service.expandedRowKeys();
      expect(expandedKeys['a']).toBe(true);
      expect(expandedKeys['b']).toBe(true);
      expect(service.areAllRowsExpanded()(stringIdItems)).toBe(true);
    });

    it('should preserve existing expanded state when updating', () => {
      // Arrange: Set initial expanded state
      service.updateExpandedRowKeys({ 1: true, 2: false });

      // Act: Update with new keys
      service.updateExpandedRowKeys({ 2: true, 3: true });

      // Assert: Should completely replace the previous state
      const expandedKeys = service.expandedRowKeys();
      expect(expandedKeys).toEqual({ 2: true, 3: true });
      expect(expandedKeys[1]).toBeUndefined(); // Should not preserve old keys
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle items with duplicate IDs gracefully', () => {
      // Arrange: Items with duplicate IDs
      const duplicateIdItems = [
        { id: 1, name: 'Item 1a', value: 10 },
        { id: 1, name: 'Item 1b', value: 20 }, // Duplicate ID
        { id: 2, name: 'Item 2', value: 30 },
      ];

      // Act: Expand all items
      service.expandAll(duplicateIdItems);

      // Assert: Should handle gracefully (last item with same ID wins)
      const expandedKeys = service.expandedRowKeys();
      expect(expandedKeys[1]).toBe(true);
      expect(expandedKeys[2]).toBe(true);
    });

    it('should work with complex ID types', () => {
      // Arrange: Items with complex object IDs (Symbol, etc.)
      const symbolId = Symbol('test');
      const complexItems = [
        { id: symbolId, name: 'Symbol Item', value: 10 },
        { id: 999, name: 'Number Item', value: 20 },
      ];

      // Act: Expand all items
      service.expandAll(complexItems);

      // Assert: Should work with Symbol and number IDs
      const expandedKeys = service.expandedRowKeys();
      expect(expandedKeys[symbolId]).toBe(true);
      expect(expandedKeys[999]).toBe(true);
      expect(service.areAllRowsExpanded()(complexItems)).toBe(true);
    });

    it('should maintain state consistency across operations', () => {
      // Arrange: Perform multiple operations
      service.expandAll(testItems);
      const afterExpandAll = service.areAllRowsExpanded()(testItems);
      
      service.collapseAll();
      const afterCollapseAll = service.areAllRowsExpanded()(testItems);
      
      service.updateExpandedRowKeys({ 1: true, 2: true, 3: true });
      const afterManualUpdate = service.areAllRowsExpanded()(testItems);

      // Assert: State should be consistent
      expect(afterExpandAll).toBe(true);
      expect(afterCollapseAll).toBe(false);
      expect(afterManualUpdate).toBe(true);
    });
  });

  describe('computed signal behavior', () => {
    it('should react to changes in expanded row keys', () => {
      // Arrange: Start with no expanded rows
      expect(service.areAllRowsExpanded()(testItems)).toBe(false);

      // Act: Update expanded keys manually
      service.expandedRowKeys.set({ 1: true, 2: true, 3: true });

      // Assert: Computed should reflect the change
      expect(service.areAllRowsExpanded()(testItems)).toBe(true);
    });

    it('should handle different item lists with same expanded keys', () => {
      // Arrange: Set up expanded keys for specific items
      service.updateExpandedRowKeys({ 1: true, 2: true });

      // Act: Test with different item lists
      const partialItems = testItems.slice(0, 2); // Only items 1 and 2
      const extendedItems = [...testItems, { id: 4, name: 'Item 4', value: 40 }];

      // Assert: Should correctly evaluate based on provided items
      expect(service.areAllRowsExpanded()(partialItems)).toBe(true); // Both items are expanded
      expect(service.areAllRowsExpanded()(extendedItems)).toBe(false); // Item 3 and 4 not expanded
    });
  });
});
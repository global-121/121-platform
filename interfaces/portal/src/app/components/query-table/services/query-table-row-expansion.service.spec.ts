import { TestBed } from '@angular/core/testing';

import { QueryTableRowExpansionService } from '~/components/query-table/services/query-table-row-expansion.service';

describe('QueryTableRowExpansionService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for mocking/test-setup
  let service: QueryTableRowExpansionService<any>;

  const testItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueryTableRowExpansionService],
    });

    service = TestBed.inject(QueryTableRowExpansionService);
  });

  it('should be created and initialize with no expanded rows', () => {
    expect(service).toBeTruthy();
    expect(service.expandedRowKeys()).toEqual({});
    expect(service.areAllRowsExpanded()(testItems)).toBe(false);
  });

  it('should expand all rows when requested', () => {
    service.expandAll(testItems);

    const expandedKeys = service.expandedRowKeys();
    expect(expandedKeys[1]).toBe(true);
    expect(expandedKeys[2]).toBe(true);
    expect(expandedKeys[3]).toBe(true);
    expect(service.areAllRowsExpanded()(testItems)).toBe(true);
  });

  it('should collapse all rows when requested', () => {
    service.expandAll(testItems);
    expect(service.areAllRowsExpanded()(testItems)).toBe(true);

    service.collapseAll();

    expect(service.expandedRowKeys()).toEqual({});
    expect(service.areAllRowsExpanded()(testItems)).toBe(false);
  });

  it('should handle empty item list correctly', () => {
    const emptyItems: Record<string, number | string>[] = [];

    expect(service.areAllRowsExpanded()(emptyItems)).toBe(false);

    service.expandAll(emptyItems);
    expect(service.expandedRowKeys()).toEqual({});
  });

  it('should correctly identify partially expanded state', () => {
    service.updateExpandedRowKeys({
      1: true,
      2: true,
      // 3 is missing (implicitly false)
    });

    expect(service.areAllRowsExpanded()(testItems)).toBe(false);
  });

  it("should update expanded row keys while triggering Angular's change detection correctly", () => {
    const originalKeys = { 1: true, 2: false };

    service.updateExpandedRowKeys(originalKeys);

    const updatedKeys = service.expandedRowKeys();
    expect(updatedKeys).toEqual(originalKeys);
    expect(updatedKeys).not.toBe(originalKeys); // Should be a new object
  });
});

import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QueryTableColumnVisibilityService } from '~/components/query-table/services/query-table-column-visibility.service';

describe('QueryTableColumnVisibilityService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableColumnVisibilityService<any>;

  const testColumns = [
    { header: 'ID', field: 'id' },
    { header: 'Name', field: 'name' },
    { header: 'Value', field: 'value', defaultHidden: true },
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [QueryTableColumnVisibilityService],
    });

    service = TestBed.inject(QueryTableColumnVisibilityService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should show only non-hidden columns by default', () => {
    const visibleColumns = service.getVisibleColumns({
      columns: testColumns,
      selectedFields: undefined,
    });

    expect(visibleColumns.map((c) => c.header)).toEqual(['ID', 'Name']);
  });

  it('should show the selected columns in the order of the selection', () => {
    const visibleColumns = service.getVisibleColumns({
      columns: testColumns,
      selectedFields: ['value', 'id'],
    });

    expect(visibleColumns.map((c) => c.header)).toEqual(['Value', 'ID']);
  });

  it('should always return the latest column definitions', () => {
    const updatedColumns = [{ header: 'ID (updated)', field: 'id' }];

    const visibleColumns = service.getVisibleColumns({
      columns: updatedColumns,
      selectedFields: ['id'],
    });

    expect(visibleColumns[0]).toBe(updatedColumns[0]);
  });

  it('should ignore selected fields that no longer exist', () => {
    const visibleColumns = service.getVisibleColumns({
      columns: testColumns,
      selectedFields: ['id', 'removed'],
    });

    expect(visibleColumns.map((c) => c.header)).toEqual(['ID']);
  });

  it('should fall back to the default columns when none of the selected fields exist', () => {
    const visibleColumns = service.getVisibleColumns({
      columns: testColumns,
      selectedFields: ['removed'],
    });

    expect(visibleColumns.map((c) => c.header)).toEqual(['ID', 'Name']);
  });

  it('should restore the selected fields from localStorage', () => {
    // Stored format contains (at least) the `field` of each column
    localStorage.setItem(
      'test-key',
      JSON.stringify([testColumns[0], testColumns[2]]),
    );

    expect(service.getStoredFields('test-key')).toEqual(['id', 'value']);
  });

  it('should store and clear the selected fields', () => {
    service.storeFields({ stateKey: 'test-key', fields: ['id', 'value'] });
    expect(service.getStoredFields('test-key')).toEqual(['id', 'value']);

    service.clearStoredFields('test-key');
    expect(localStorage.getItem('test-key')).toBeNull();
    expect(service.getStoredFields('test-key')).toBeUndefined();
  });

  it('should not use localStorage without a state key', () => {
    service.storeFields({ stateKey: undefined, fields: ['id'] });

    expect(service.getStoredFields(undefined)).toBeUndefined();
    expect(localStorage.length).toBe(0);
  });
});

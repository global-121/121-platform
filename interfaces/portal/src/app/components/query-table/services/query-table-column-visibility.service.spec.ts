import { TestBed } from '@angular/core/testing';

import { QueryTableColumnVisibilityService } from '~/components/query-table/services/query-table-column-visibility.service';

describe('QueryTableColumnVisibilityService', () => {
  let service: QueryTableColumnVisibilityService<any>;

  const testColumns = [
    { header: 'ID', field: 'id' },
    { header: 'Name', field: 'name' },
    { header: 'Value', field: 'value', defaultHidden: true },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueryTableColumnVisibilityService],
    });

    service = TestBed.inject(QueryTableColumnVisibilityService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and initialize with empty visible columns', () => {
    expect(service).toBeTruthy();
    expect(service.visibleColumns()).toEqual([]);
  });

  it('should show only non-hidden columns by default', () => {
    service.updateColumnVisibility({
      columns: testColumns,
      selectedColumnsStateKey: undefined,
    });

    const visibleColumns = service.visibleColumns();
    expect(visibleColumns.length).toBe(2);
    expect(visibleColumns.map((c) => c.header)).toEqual(['ID', 'Name']);
  });

  it('should restore columns from localStorage when available', () => {
    const storedColumns = [testColumns[0], testColumns[2]]; // ID and Value
    localStorage.setItem('test-key', JSON.stringify(storedColumns));

    service.updateColumnVisibility({
      columns: testColumns,
      selectedColumnsStateKey: 'test-key',
    });

    const visibleColumns = service.visibleColumns();
    expect(visibleColumns.length).toBe(2);
    expect(visibleColumns.map((c) => c.header)).toEqual(['ID', 'Value']);
  });

  it('should revert to default columns when requested', () => {
    localStorage.setItem('test-key', JSON.stringify([testColumns[2]]));

    service.updateColumnVisibility({
      columns: testColumns,
      selectedColumnsStateKey: 'test-key',
      revertToDefault: true,
    });

    expect(localStorage.getItem('test-key')).toBeNull();
    const visibleColumns = service.visibleColumns();
    expect(visibleColumns.length).toBe(2);
    expect(visibleColumns.map((c) => c.header)).toEqual(['ID', 'Name']);
  });

  it('should manually update visible columns', () => {
    const customColumns = [testColumns[0], testColumns[2]];

    service.visibleColumns.set(customColumns);

    expect(service.visibleColumns()).toEqual(customColumns);
    expect(service.visibleColumns().map((c) => c.header)).toEqual([
      'ID',
      'Value',
    ]);
  });
});

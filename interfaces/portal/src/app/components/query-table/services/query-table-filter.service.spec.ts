import { TestBed } from '@angular/core/testing';

import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';
import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { useLocalStorageMock } from '~/test-utils';

describe('QueryTableFilterService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableFilterService<any>;
  const localStorageMock = useLocalStorageMock();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueryTableFilterService, QueryTableCellService],
    });

    service = TestBed.inject(QueryTableFilterService);
  });

  it('should be created and initialize with correct default state', () => {
    expect(service).toBeTruthy();
    expect(service.globalFilterVisible()).toBe(false);
    expect(service.globalFilterValue()).toBeUndefined();
    expect(service.isFiltered()).toBe(false);
  });

  it('should detect global filter when value is set', () => {
    service.updateTableFilters({
      global: { value: 'test', matchMode: 'contains' },
    });

    expect(service.globalFilterValue()).toBe('test');
    expect(service.isFiltered()).toBe(true);
  });

  it('should clear all filters', () => {
    const clearTableSpy = jest.fn();
    const resetSelectionSpy = jest.fn();

    service.globalFilterVisible.set(true);

    service.clearAllFilters({
      clearTable: clearTableSpy,
      localStorageKey: 'test-key',
      resetSelection: resetSelectionSpy,
    });

    expect(clearTableSpy).toHaveBeenCalled();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    expect(service.globalFilterVisible()).toBe(false);
    expect(resetSelectionSpy).toHaveBeenCalled();
  });
});

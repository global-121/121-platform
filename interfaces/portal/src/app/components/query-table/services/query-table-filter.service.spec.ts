import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';
import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { TrackingService } from '~/services/tracking.service';

class TrackingServiceStub {
  trackEvent = vi.fn();
}

describe('QueryTableFilterService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableFilterService<any>;

  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
  const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

  beforeEach(() => {
    getItemSpy.mockClear();
    removeItemSpy.mockClear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        QueryTableFilterService,
        QueryTableCellService,
        { provide: TrackingService, useClass: TrackingServiceStub },
      ],
    });

    service = TestBed.inject(QueryTableFilterService);
  });

  afterEach(() => {
    getItemSpy.mockClear();
    removeItemSpy.mockClear();
    localStorage.clear();
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
    const clearTableSpy = vi.fn();
    const resetSelectionSpy = vi.fn();

    service.globalFilterVisible.set(true);

    service.clearAllFilters({
      clearTable: clearTableSpy,
      localStorageKey: 'test-key',
      resetSelection: resetSelectionSpy,
    });

    expect(clearTableSpy).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith('test-key');
    expect(service.globalFilterVisible()).toBe(false);
    expect(resetSelectionSpy).toHaveBeenCalled();
  });
});

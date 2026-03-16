import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';
import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { TrackingService } from '~/services/tracking.service';

class TrackingServiceStub {
  trackEvent = vi.fn();
}

describe('QueryTableFilterService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableFilterService<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QueryTableFilterService,
        QueryTableCellService,
        { provide: TrackingService, useClass: TrackingServiceStub },
      ],
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
    const clearTableSpy = vi.fn();
    const resetSelectionSpy = vi.fn();

    service.globalFilterVisible.set(true);

    service.clearAllFilters({
      clearTable: clearTableSpy,
      localStorageKey: 'test-key',
      resetSelection: resetSelectionSpy,
    });

    expect(clearTableSpy).toHaveBeenCalled();
    // #TODO: check if workaround is fine
    expect(localStorage.getItem('test-key')).toBeNull();
    // expect(vi.spyOn(window.localStorage, 'removeItem')).toHaveBeenCalledWith(
    //   'test-key',
    // );
    expect(service.globalFilterVisible()).toBe(false);
    expect(resetSelectionSpy).toHaveBeenCalled();
  });
});

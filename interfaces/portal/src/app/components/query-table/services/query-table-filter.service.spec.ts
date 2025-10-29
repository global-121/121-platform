import { TestBed } from '@angular/core/testing';

import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { TrackingService } from '~/services/tracking.service';

describe('QueryTableFilterService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableFilterService<any>;
  let trackingService: jasmine.SpyObj<TrackingService>;

  beforeEach(() => {
    const trackingServiceSpy = jasmine.createSpyObj('TrackingService', [
      'trackEvent',
    ]) as jasmine.SpyObj<TrackingService>;

    TestBed.configureTestingModule({
      providers: [
        QueryTableFilterService,
        { provide: TrackingService, useValue: trackingServiceSpy },
      ],
    });

    service = TestBed.inject(QueryTableFilterService);
    trackingService = TestBed.inject(
      TrackingService,
    ) as jasmine.SpyObj<TrackingService>;
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

  it('should clear all filters and trigger tracking event', () => {
    const clearTableSpy = jasmine.createSpy('clearTable');
    const resetSelectionSpy = jasmine.createSpy('resetSelection');

    spyOn(localStorage, 'removeItem');
    service.globalFilterVisible.set(true);

    service.clearAllFilters({
      clearTable: clearTableSpy,
      localStorageKey: 'test-key',
      resetSelection: resetSelectionSpy,
    });

    expect(clearTableSpy).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Mocking localStorage in tests
    expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    expect(service.globalFilterVisible()).toBe(false);
    expect(resetSelectionSpy).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Mocking service methods in tests
    expect(trackingService.trackEvent).toHaveBeenCalled();
  });
});

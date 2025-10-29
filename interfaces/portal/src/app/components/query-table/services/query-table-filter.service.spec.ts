import { TestBed } from '@angular/core/testing';

import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { TrackingService } from '~/services/tracking.service';

describe('QueryTableFilterService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableFilterService<any>;
  // const trackEventSpy = jasmine.createSpy();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QueryTableFilterService,
        {
          provide: TrackingService,
          // useValue: jasmine.createSpyObj(
          //   'TrackingService',
          //   {},
          //   {
          //     trackEvent: trackEventSpy,
          //   },
          // ) as jasmine.SpyObj<TrackingService>,
        },
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

  it('should clear all filters and trigger tracking event', () => {
    const clearTableSpy = jasmine.createSpy('clearTable');
    const resetSelectionSpy = jasmine.createSpy('resetSelection');
    const localStorateSpy = spyOn(localStorage, 'removeItem');
    const trackingService = TestBed.inject(TrackingService);
    const trackEventSpy = spyOn(trackingService, 'trackEvent');

    service.globalFilterVisible.set(true);

    service.clearAllFilters({
      clearTable: clearTableSpy,
      localStorageKey: 'test-key',
      resetSelection: resetSelectionSpy,
    });

    expect(clearTableSpy).toHaveBeenCalled();
    expect(localStorateSpy).toHaveBeenCalledWith('test-key');
    expect(service.globalFilterVisible()).toBe(false);
    expect(resetSelectionSpy).toHaveBeenCalled();
    expect(trackEventSpy).toHaveBeenCalled();
  });
});

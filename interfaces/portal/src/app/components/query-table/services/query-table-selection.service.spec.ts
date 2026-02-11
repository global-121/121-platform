import { TestBed } from '@angular/core/testing';

import { QueryTableSelectionService } from '~/components/query-table/services/query-table-selection.service';
import {
  ActionDataWithPaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

describe('QueryTableSelectionService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for test-setup
  let service: QueryTableSelectionService<any>;
  let paginateQueryService: jest.Mocked<PaginateQueryService>;
  let showToastSpy: jest.Mock;

  beforeEach(() => {
    showToastSpy = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        QueryTableSelectionService,
        {
          provide: PaginateQueryService,
          useValue: {
            selectionEventToActionData: jest.fn(),
          } as unknown as jest.Mocked<PaginateQueryService>,
        },
        {
          provide: ToastService,
          useValue: {
            showToast: showToastSpy,
          },
        },
      ],
    });

    service = TestBed.inject(QueryTableSelectionService);
    paginateQueryService = TestBed.inject(
      PaginateQueryService,
    ) as jest.Mocked<PaginateQueryService>;
  });

  it('should be created and initialize with empty selection state', () => {
    expect(service).toBeTruthy();
    expect(service.selectedItems()).toEqual([]);
    expect(service.selectAll()).toBe(false);
    expect(service.tableSelection()).toEqual([]);
  });

  it('should update selection when items are selected', () => {
    const testItems = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    service.onSelectionChange(testItems);

    expect(service.selectedItems()).toEqual(testItems);
    expect(service.tableSelection()).toEqual(testItems);
  });

  it('should handle select all functionality', () => {
    service.setServerSideTotalRecordsProvider(() => 100);

    service.onSelectAllChange({
      originalEvent: new Event('change'),
      checked: true,
    });

    expect(service.selectAll()).toBe(true);
    expect(service.selectedItems()).toEqual([]);
    expect(service.tableSelection()).toEqual({ selectAll: true });
  });

  it('should reset selection state', () => {
    const testItems = [{ id: 1, name: 'Item 1' }];
    service.onSelectionChange(testItems);

    service.resetSelection();

    expect(service.selectedItems()).toEqual([]);
    expect(service.selectAll()).toBe(false);
    expect(service.tableSelection()).toEqual([]);
  });

  it('should show toast when no items are selected', () => {
    paginateQueryService.selectionEventToActionData.mockReturnValue(
      {} as ActionDataWithPaginateQuery<unknown>,
    );

    const result = service.getActionData({
      fieldForFilter: 'id',
      noSelectionToastMessage: 'Please select items',
      serverSideFiltering: false,
      tableFilteredValue: null,
      items: [],
      totalRecords: 0,
      visibleColumns: [],
    });

    expect(result).toBeUndefined();
    expect(showToastSpy).toHaveBeenCalledWith({
      severity: 'error',
      detail: 'Please select items',
    });
  });
});

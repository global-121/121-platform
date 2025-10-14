import { TestBed } from '@angular/core/testing';
import { TableSelectAllChangeEvent } from 'primeng/table';

import { QueryTableColumn } from '../query-table.component';
import { QueryTableSelectionService } from './query-table-selection.service';
import { PaginateQueryService } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

type TestData = { id: number; name: string; value: number };

describe('QueryTableSelectionService', () => {
  let service: QueryTableSelectionService<TestData>;
  let paginateQueryService: jasmine.SpyObj<PaginateQueryService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const paginateQueryServiceSpy = jasmine.createSpyObj('PaginateQueryService', ['selectionEventToActionData']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['showGenericError', 'showToast']);

    TestBed.configureTestingModule({
      providers: [
        QueryTableSelectionService,
        { provide: PaginateQueryService, useValue: paginateQueryServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    });

    service = TestBed.inject(QueryTableSelectionService);
    paginateQueryService = TestBed.inject(PaginateQueryService) as jasmine.SpyObj<PaginateQueryService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('selection state management', () => {
    it('should initialize with empty selection state', () => {
      expect(service.selectedItems()).toEqual([]);
      expect(service.selectAll()).toBe(false);
      expect(service.tableSelection()).toEqual([]);
      expect(service.selectedItemsCount()).toBe(0);
    });

    it('should update selection when items are selected', () => {
      // Arrange: Test data
      const testItems: TestData[] = [
        { id: 1, name: 'Item 1', value: 10 },
        { id: 2, name: 'Item 2', value: 20 },
      ];

      // Act: Select items
      service.onSelectionChange(testItems);

      // Assert: Selection state should be updated
      expect(service.selectedItems()).toEqual(testItems);
      expect(service.tableSelection()).toEqual(testItems);
      expect(service.selectedItemsCount()).toBe(2);
    });

    it('should handle select all functionality', () => {
      // Arrange: Set up server side total records
      service.setServerSideTotalRecordsProvider(() => 100);

      // Act: Select all
      const selectAllEvent: TableSelectAllChangeEvent = { checked: true };
      service.onSelectAllChange(selectAllEvent);

      // Assert: Should set select all state and clear individual selections
      expect(service.selectAll()).toBe(true);
      expect(service.selectedItems()).toEqual([]);
      expect(service.tableSelection()).toEqual({ selectAll: true });
      expect(service.selectedItemsCount()).toBe(100);
    });

    it('should handle unselect all functionality', () => {
      // Arrange: Start with select all state
      const selectAllEvent: TableSelectAllChangeEvent = { checked: true };
      service.onSelectAllChange(selectAllEvent);

      // Act: Unselect all
      const unselectAllEvent: TableSelectAllChangeEvent = { checked: false };
      service.onSelectAllChange(unselectAllEvent);

      // Assert: Should clear all selections
      expect(service.selectAll()).toBe(false);
      expect(service.selectedItems()).toEqual([]);
      expect(service.tableSelection()).toEqual([]);
      expect(service.selectedItemsCount()).toBe(0);
    });

    it('should reset selection state', () => {
      // Arrange: Set up some selection state
      const testItems: TestData[] = [{ id: 1, name: 'Item 1', value: 10 }];
      service.onSelectionChange(testItems);

      // Act: Reset selection
      service.resetSelection();

      // Assert: All selection state should be cleared
      expect(service.selectedItems()).toEqual([]);
      expect(service.selectAll()).toBe(false);
      expect(service.tableSelection()).toEqual([]);
      expect(service.selectedItemsCount()).toBe(0);
    });
  });

  describe('action data generation', () => {
    const testItems: TestData[] = [
      { id: 1, name: 'Item 1', value: 10 },
      { id: 2, name: 'Item 2', value: 20 },
    ];

    const visibleColumns: QueryTableColumn<TestData>[] = [
      { header: 'ID', field: 'id' },
      { header: 'Name', field: 'name' },
    ];

    beforeEach(() => {
      paginateQueryService.selectionEventToActionData.and.returnValue({ test: 'data' });
    });

    it('should generate action data for selected items', () => {
      // Arrange: Select some items
      service.onSelectionChange([testItems[0]]);

      // Act: Get action data
      const result = service.getActionData({
        fieldForFilter: 'id',
        noSelectionToastMessage: 'No selection',
        serverSideFiltering: false,
        tableFilteredValue: null,
        items: testItems,
        totalRecords: testItems.length,
        visibleColumns,
      });

      // Assert: Should call paginate query service with correct parameters
      expect(result).toEqual({ test: 'data' });
      expect(paginateQueryService.selectionEventToActionData).toHaveBeenCalledWith({
        selection: [testItems[0]],
        fieldForFilter: 'id',
        totalCount: testItems.length,
        currentPaginateQuery: undefined,
        previewItemForSelectAll: testItems[0],
        select: ['id', 'name'],
      });
    });

    it('should handle select all with client-side filtering', () => {
      // Arrange: Set select all state
      const selectAllEvent: TableSelectAllChangeEvent = { checked: true };
      service.onSelectAllChange(selectAllEvent);

      // Act: Get action data with filtered items
      service.getActionData({
        fieldForFilter: 'id',
        noSelectionToastMessage: 'No selection',
        serverSideFiltering: false,
        tableFilteredValue: [testItems[0]], // Filtered to one item
        items: testItems,
        totalRecords: testItems.length,
        visibleColumns,
      });

      // Assert: Should use filtered items instead of all items
      expect(paginateQueryService.selectionEventToActionData).toHaveBeenCalledWith({
        selection: [testItems[0]],
        fieldForFilter: 'id',
        totalCount: testItems.length,
        currentPaginateQuery: undefined,
        previewItemForSelectAll: testItems[0],
        select: ['id', 'name'],
      });
    });

    it('should handle select all without filters', () => {
      // Arrange: Set select all state
      const selectAllEvent: TableSelectAllChangeEvent = { checked: true };
      service.onSelectAllChange(selectAllEvent);

      // Act: Get action data without filtered items
      service.getActionData({
        fieldForFilter: 'id',
        noSelectionToastMessage: 'No selection',
        serverSideFiltering: false,
        tableFilteredValue: null,
        items: testItems,
        totalRecords: testItems.length,
        visibleColumns,
      });

      // Assert: Should use all items
      expect(paginateQueryService.selectionEventToActionData).toHaveBeenCalledWith({
        selection: testItems,
        fieldForFilter: 'id',
        totalCount: testItems.length,
        currentPaginateQuery: undefined,
        previewItemForSelectAll: testItems[0],
        select: ['id', 'name'],
      });
    });

    it('should show toast when no items are selected', () => {
      // Act: Get action data with no selection
      const result = service.getActionData({
        fieldForFilter: 'id',
        noSelectionToastMessage: 'Please select items',
        serverSideFiltering: false,
        tableFilteredValue: null,
        items: testItems,
        totalRecords: testItems.length,
        visibleColumns,
      });

      // Assert: Should show error toast and return undefined
      expect(result).toBeUndefined();
      expect(toastService.showToast).toHaveBeenCalledWith({
        severity: 'error',
        detail: 'Please select items',
      });
    });

    it('should handle context menu triggered actions', () => {
      // Arrange: Context menu item
      const contextMenuItem = testItems[0];

      // Act: Get action data triggered from context menu
      const result = service.getActionData({
        fieldForFilter: 'id',
        noSelectionToastMessage: 'No selection',
        triggeredFromContextMenu: true,
        contextMenuItem,
        serverSideFiltering: false,
        tableFilteredValue: null,
        items: testItems,
        totalRecords: testItems.length,
        visibleColumns,
      });

      // Assert: Should use context menu item as selection
      expect(result).toEqual({ test: 'data' });
      expect(paginateQueryService.selectionEventToActionData).toHaveBeenCalledWith({
        selection: [contextMenuItem],
        fieldForFilter: 'id',
        totalCount: testItems.length,
        currentPaginateQuery: undefined,
        previewItemForSelectAll: testItems[0],
        select: ['id', 'name'],
      });
    });

    it('should show generic error when context menu item is missing', () => {
      // Act: Get action data from context menu without item
      const result = service.getActionData({
        fieldForFilter: 'id',
        noSelectionToastMessage: 'No selection',
        triggeredFromContextMenu: true,
        contextMenuItem: undefined,
        serverSideFiltering: false,
        tableFilteredValue: null,
        items: testItems,
        totalRecords: testItems.length,
        visibleColumns,
      });

      // Assert: Should show generic error and return undefined
      expect(result).toBeUndefined();
      expect(toastService.showGenericError).toHaveBeenCalled();
    });
  });

  describe('server side total records provider', () => {
    it('should use provided server side total records for selected count', () => {
      // Arrange: Set up provider and select all
      service.setServerSideTotalRecordsProvider(() => 150);
      const selectAllEvent: TableSelectAllChangeEvent = { checked: true };
      service.onSelectAllChange(selectAllEvent);

      // Assert: Should use server side count
      expect(service.selectedItemsCount()).toBe(150);
    });

    it('should fall back to individual item count when not select all', () => {
      // Arrange: Set up provider and select individual items
      service.setServerSideTotalRecordsProvider(() => 150);
      const testItems: TestData[] = [
        { id: 1, name: 'Item 1', value: 10 },
        { id: 2, name: 'Item 2', value: 20 },
      ];
      service.onSelectionChange(testItems);

      // Assert: Should use individual item count, not server side count
      expect(service.selectedItemsCount()).toBe(2);
    });
  });
});
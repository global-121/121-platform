import {
  ChangeDetectionStrategy,
  Component,
  input,
  LOCALE_ID,
  signal,
  Type,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MenuItem, MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { QueryTableRowExpansionService } from '~/components/query-table/services/query-table-row-expansion.service';
import { QueryTableSelectionService } from '~/components/query-table/services/query-table-selection.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { TrackingService } from '~/services/tracking/tracking.service';
import { Locale } from '~/utils/locale';

// To make the tests concerning PrimeNG ContextMenu work.
// See: https://rebeccamdeprey.com/blog/mock-windowmatchmedia-in-vitest
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    enumerable: true,
    value: vi.fn().mockImplementation((query: unknown) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

interface TestRow {
  id: number;
  registrationProgramId: string;
  created: string;
  status: string;
}

interface TestContext {
  scope: string;
}

@Component({
  selector: 'app-query-table-host-spec',
  imports: [QueryTableComponent],
  template: `
    <app-query-table
      [items]="items"
      [columns]="columns"
      [isPending]="false"
      [serverSideFiltering]="false"
      [enableSelection]="false"
      [enableColumnManagement]="false"
      [localStorageKey]="'host-table'"
    >
      <div
        i18n
        table-actions
        data-testid="projected-actions"
      >
        Projected content
      </div>
    </app-query-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class QueryTableHostComponent {
  readonly items = [
    {
      id: 1,
      registrationProgramId: 'P-001',
      created: '2024-01-01T00:00:00Z',
      status: 'pending',
    },
  ];

  readonly columns: QueryTableColumn<TestRow>[] = [
    {
      header: 'Registration ID',
      field: 'registrationProgramId',
      type: undefined,
    },
  ];
}

@Component({
  selector: 'app-test-expandable-cell',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestExpandableCellComponent extends TableCellComponent<
  TestRow,
  TestContext
> {}

@Component({
  selector: 'app-test-cell',
  template: '<span data-testid="custom-cell"></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestCellComponent implements TableCellComponent<TestRow> {
  readonly value = input.required<TestRow>();
  readonly context = input<never>();
}

class RtlHelperServiceStub {
  createPosition() {
    return signal<'left' | 'right'>('left');
  }

  createRtlFriendlyChevronIcon() {
    return signal('classnames');
  }
}

class TrackingServiceStub {
  trackEvent = vi.fn();
}

describe('QueryTableComponent', () => {
  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

  const DEFAULT_ITEMS: TestRow[] = [
    {
      id: 1,
      registrationProgramId: 'P-001',
      created: '2024-01-01T00:00:00Z',
      status: 'pending',
    },
  ];

  const DEFAULT_COLUMNS: QueryTableColumn<TestRow>[] = [
    {
      header: 'Registration ID',
      field: 'registrationProgramId',
      type: undefined,
    },
    {
      header: 'Status',
      field: 'status',
      type: undefined,
    },
  ];

  interface ComponentInputs {
    items: TestRow[];
    columns: QueryTableColumn<TestRow>[];
    isPending: boolean;
    serverSideFiltering: boolean;
    globalFilterFields?: (keyof TestRow)[];
    contextMenuItems?: MenuItem[];
    enableSelection: boolean;
    enableColumnManagement: boolean;
    localStorageKey?: string;
    serverSideTotalRecords?: number;
    expandableRowTemplate?: Type<TableCellComponent<TestRow, TestContext>>;
    tableCellContext?: TestContext;
  }

  let fixture: ComponentFixture<QueryTableComponent<TestRow, TestContext>>;

  beforeEach(async () => {
    getItemSpy.mockClear();
    setItemSpy.mockClear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [
        QueryTableComponent,
        QueryTableHostComponent,
        TestExpandableCellComponent,
      ],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: Locale.en },
        { provide: RtlHelperService, useClass: RtlHelperServiceStub },
        { provide: TrackingService, useClass: TrackingServiceStub },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      QueryTableComponent<TestRow, TestContext>,
    );

    setComponentInputs();
    fixture.detectChanges();
  });

  const setComponentInputs = (overrides: Partial<ComponentInputs> = {}) => {
    const defaults: ComponentInputs = {
      items: DEFAULT_ITEMS,
      columns: DEFAULT_COLUMNS,
      isPending: false,
      serverSideFiltering: false,
      enableSelection: false,
      enableColumnManagement: false,
    };

    const values = { ...defaults, ...overrides };

    fixture.componentRef.setInput('items', values.items);
    fixture.componentRef.setInput('columns', values.columns);
    fixture.componentRef.setInput('isPending', values.isPending);
    fixture.componentRef.setInput(
      'serverSideFiltering',
      values.serverSideFiltering,
    );
    fixture.componentRef.setInput('enableSelection', values.enableSelection);
    fixture.componentRef.setInput(
      'enableColumnManagement',
      values.enableColumnManagement,
    );
    fixture.componentRef.setInput(
      'globalFilterFields',
      values.globalFilterFields,
    );
    fixture.componentRef.setInput('contextMenuItems', values.contextMenuItems);
    fixture.componentRef.setInput('localStorageKey', values.localStorageKey);
    fixture.componentRef.setInput(
      'serverSideTotalRecords',
      values.serverSideTotalRecords,
    );
    fixture.componentRef.setInput(
      'expandableRowTemplate',
      values.expandableRowTemplate,
    );
    fixture.componentRef.setInput('tableCellContext', values.tableCellContext);
  };

  afterEach(() => {
    getItemSpy.mockClear();
    setItemSpy.mockClear();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the provided items within the table', () => {
      const items: TestRow[] = [
        {
          id: 1,
          registrationProgramId: 'P-001',
          created: '2024-01-01T00:00:00Z',
          status: 'pending',
        },
        {
          id: 2,
          registrationProgramId: 'P-002',
          created: '2024-02-01T00:00:00Z',
          status: 'completed',
        },
      ];

      setComponentInputs({ items });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const rows = Array.from<HTMLTableRowElement>(
        hostElement.querySelectorAll<HTMLTableRowElement>('tbody tr'),
      );

      expect(rows.length).toBe(items.length);
      expect(rows[0].textContent).toContain('P-001');
      expect(rows[1].textContent).toContain('P-002');
    });

    it('shows the loading skeleton rows when isPending is true', () => {
      setComponentInputs({ isPending: true });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const skeletonRows = hostElement.querySelectorAll<HTMLTableRowElement>(
        'tr[data-testid="query-table-loading"]',
      );

      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it('renders projected table-actions content within the caption', () => {
      const hostFixture = TestBed.createComponent(QueryTableHostComponent);
      hostFixture.detectChanges();

      const hostElement = hostFixture.nativeElement as HTMLElement;
      const projected = hostElement.querySelector<HTMLDivElement>(
        '[data-testid="projected-actions"]',
      );

      expect(projected).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Check for null happens at line above
      const projectedDiv = projected!;
      expect(projectedDiv.textContent).not.toBeNull();
      const projectedText = projectedDiv.textContent;
      expect(projectedText.trim()).toBe('Projected content');
    });

    it('renders the global search widget when globalFilterFields are provided', () => {
      setComponentInputs({ globalFilterFields: ['status'] });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const searchComponent = hostElement.querySelector(
        'app-query-table-global-search',
      );

      expect(searchComponent).not.toBeNull();
    });

    it('renders the column management trigger when enableColumnManagement is true', () => {
      setComponentInputs({
        enableColumnManagement: true,
        localStorageKey: 'query-table-test',
      });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const columnManagement = hostElement.querySelector(
        'app-query-table-column-management',
      );

      expect(columnManagement).not.toBeNull();
    });

    it('renders a selection column when enableSelection is true', () => {
      setComponentInputs({ enableSelection: true });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const selectionHeader = hostElement.querySelector(
        'p-tableheadercheckbox',
      );

      expect(selectionHeader).not.toBeNull();
    });

    it('renders an expansion column when expandableRowTemplate is provided', () => {
      setComponentInputs({
        expandableRowTemplate: TestExpandableCellComponent,
      });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const expandAllButton = hostElement.querySelector(
        '[data-testid="expand-all-rows-button"]',
      );

      expect(expandAllButton).not.toBeNull();
    });

    it('renders an actions column when context menu items are provided', () => {
      setComponentInputs({
        contextMenuItems: [{ label: 'View' }],
      });
      fixture.detectChanges();

      const hostElement = fixture.nativeElement as HTMLElement;
      const actionsHeader = Array.from<HTMLTableCellElement>(
        hostElement.querySelectorAll<HTMLTableCellElement>('th'),
      ).find((header) => {
        const headerText = header.textContent as null | string;
        return !!headerText && headerText.includes('Actions');
      });

      expect(actionsHeader).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Check for null happens at line above
      const actionsHeaderCell = actionsHeader!;
      expect(actionsHeaderCell.textContent).not.toBeNull();
      const headerText = actionsHeaderCell.textContent;
      expect(headerText).toContain('Actions');
    });
  });

  describe('behaviour', () => {
    it('emits updatePaginateQuery when PrimeNG emits a lazy load event', () => {
      const updateSpy = vi.spyOn(
        fixture.componentInstance.updatePaginateQuery,
        'emit',
      );

      fixture.componentInstance.onLazyLoadEvent({
        first: 0,
        rows: 10,
        sortField: 'created',
        sortOrder: 1,
      });

      expect(updateSpy).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: [['created', 'ASC']],
        filter: undefined,
        search: undefined,
      });
    });

    it('emits updateContextMenuItem and tracks the click when toggling more actions', () => {
      const trackingService = TestBed.inject(
        TrackingService,
      ) as unknown as TrackingServiceStub;
      const toggleSpy = vi.spyOn(
        fixture.componentInstance.updateContextMenuItem,
        'emit',
      );

      setComponentInputs({ contextMenuItems: [{ label: 'View' }] });
      fixture.detectChanges();

      const extraOptionsMenu = fixture.componentInstance.extraOptionsMenu();
      if (extraOptionsMenu) {
        vi.spyOn(extraOptionsMenu, 'toggle');
      }

      const item = DEFAULT_ITEMS[0];
      fixture.componentInstance.toggleMoreActionsMenu(new Event('click'), item);

      expect(toggleSpy).toHaveBeenCalledWith(item);
      expect(trackingService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'click: More-Actions-menu Button',
        }),
      );
    });

    it('clears filters and resets selection when clearAllFilters is invoked', () => {
      const filterService = fixture.componentRef.injector.get(
        QueryTableFilterService,
      ) as QueryTableFilterService<TestRow>;
      const selectionService = fixture.componentRef.injector.get(
        QueryTableSelectionService,
      ) as unknown as QueryTableSelectionService<TestRow>;

      setComponentInputs({ localStorageKey: 'query-table-test' });
      fixture.detectChanges();

      localStorage.setItem('query-table-test', 'cached-columns');

      const table = fixture.componentInstance.table();
      const clearTableSpy = vi.spyOn(table, 'clear');
      const resetSelectionSpy = vi.spyOn(selectionService, 'resetSelection');
      const clearAllFiltersSpy = vi.spyOn(filterService, 'clearAllFilters');

      fixture.componentInstance.clearAllFilters();

      expect(clearAllFiltersSpy).toHaveBeenCalledTimes(1);
      expect(clearTableSpy).toHaveBeenCalled();
      expect(resetSelectionSpy).toHaveBeenCalled();
      expect(localStorage.getItem('query-table-test')).toBeNull();
    });

    it('delegates getActionData to the selection service', () => {
      const selectionService = fixture.componentRef.injector.get(
        QueryTableSelectionService,
      ) as unknown as QueryTableSelectionService<TestRow>;

      const expectedResult = {} as ActionDataWithPaginateQuery<TestRow>;
      const getActionDataSpy = vi
        .spyOn(selectionService, 'getActionData')
        .mockReturnValue(expectedResult);

      const result = fixture.componentInstance.getActionData({
        fieldForFilter: 'status',
        noSelectionToastMessage: 'Select something',
      });

      expect(getActionDataSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedResult);
    });

    it('expands and collapses all rows via the row expansion service', () => {
      const rowExpansionService = fixture.componentRef.injector.get(
        QueryTableRowExpansionService,
      ) as unknown as QueryTableRowExpansionService<TestRow>;

      fixture.componentInstance.expandAll();
      expect(rowExpansionService.expandedRowKeys()).toEqual({ 1: true });

      fixture.componentInstance.collapseAll();
      expect(rowExpansionService.expandedRowKeys()).toEqual({});
    });
  });

  describe('column visibility', () => {
    const STATE_KEY = 'query-table-test-selected-columns';
    const ALL_COLUMNS: QueryTableColumn<TestRow>[] = [
      { header: 'Registration ID', field: 'registrationProgramId' },
      { header: 'Status', field: 'status' },
      { header: 'Created', field: 'created', defaultHidden: true },
    ];
    const headersOf = (columns: QueryTableColumn<TestRow>[]) =>
      columns.map((column) => column.header);

    beforeEach(() => {
      setComponentInputs({
        columns: ALL_COLUMNS,
        enableColumnManagement: true,
        localStorageKey: 'query-table-test',
      });
      fixture.detectChanges();
    });

    it('shows the non-hidden columns by default', () => {
      expect(headersOf(fixture.componentInstance.visibleColumns())).toEqual([
        'Registration ID',
        'Status',
      ]);
    });

    it('renders the updated definitions of the selected columns after the columns input is replaced', () => {
      // Select a subset: "Created" (hidden by default) and "Status"
      fixture.componentInstance.updateVisibleColumns([
        ALL_COLUMNS[1],
        ALL_COLUMNS[2],
      ]);
      fixture.detectChanges();

      const getHeaderTexts = () =>
        Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll('thead th'),
        ).map((th) => th.textContent.trim());
      const getCustomCells = () =>
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          '[data-testid="custom-cell"]',
        );

      expect(getHeaderTexts()).toEqual(['Status', 'Created']);
      expect(getCustomCells()).toHaveLength(0);

      // Replace the columns with updated definitions (new header + new cell component)
      const updatedColumns: QueryTableColumn<TestRow>[] = [
        { header: 'Registration ID', field: 'registrationProgramId' },
        {
          header: 'Status (updated)',
          field: 'status',
          component: TestCellComponent,
        },
        { header: 'Created (updated)', field: 'created', defaultHidden: true },
      ];
      setComponentInputs({
        columns: updatedColumns,
        enableColumnManagement: true,
        localStorageKey: 'query-table-test',
      });
      fixture.detectChanges();

      // Selection is preserved ("Registration ID" is still not shown)...
      expect(headersOf(fixture.componentInstance.visibleColumns())).toEqual([
        'Status (updated)',
        'Created (updated)',
      ]);
      // ...and the rendered table uses the new definitions
      expect(getHeaderTexts()).toEqual([
        'Status (updated)',
        'Created (updated)',
      ]);
      expect(getCustomCells()).toHaveLength(DEFAULT_ITEMS.length);
    });

    it('stores the selected columns and restores them on a new table', () => {
      fixture.componentInstance.updateVisibleColumns([ALL_COLUMNS[2]]);

      expect(JSON.parse(localStorage.getItem(STATE_KEY) ?? '[]')).toEqual([
        { field: 'created' },
      ]);

      const newFixture = TestBed.createComponent(
        QueryTableComponent<TestRow, TestContext>,
      );
      newFixture.componentRef.setInput('items', DEFAULT_ITEMS);
      newFixture.componentRef.setInput('columns', ALL_COLUMNS);
      newFixture.componentRef.setInput('isPending', false);
      newFixture.componentRef.setInput('enableColumnManagement', true);
      newFixture.componentRef.setInput('localStorageKey', 'query-table-test');
      newFixture.detectChanges();

      expect(headersOf(newFixture.componentInstance.visibleColumns())).toEqual([
        'Created',
      ]);
    });

    it('restores the default columns and clears the storage when reset', () => {
      fixture.componentInstance.updateVisibleColumns([ALL_COLUMNS[2]]);
      expect(headersOf(fixture.componentInstance.visibleColumns())).toEqual([
        'Created',
      ]);

      fixture.componentInstance.resetVisibleColumns();

      expect(localStorage.getItem(STATE_KEY)).toBeNull();
      expect(headersOf(fixture.componentInstance.visibleColumns())).toEqual([
        'Registration ID',
        'Status',
      ]);
    });
  });

  describe('computed signals', () => {
    it('computes selectedColumnsStateKey based on the localStorageKey input', () => {
      expect(
        fixture.componentInstance.selectedColumnsStateKey(),
      ).toBeUndefined();

      setComponentInputs({ localStorageKey: 'query-table' });
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedColumnsStateKey()).toBe(
        'query-table-selected-columns',
      );
    });

    it('computes totalColumnCount including auxiliary columns', () => {
      setComponentInputs({
        enableSelection: true,
        contextMenuItems: [{ label: 'View' }],
        expandableRowTemplate: TestExpandableCellComponent,
      });
      fixture.detectChanges();

      expect(fixture.componentInstance.totalColumnCount()).toBe(
        DEFAULT_COLUMNS.length + 3,
      );
    });

    it('exposes selectedItemsCount from the selection service', () => {
      const selectionService = fixture.componentRef.injector.get(
        QueryTableSelectionService,
      ) as unknown as QueryTableSelectionService<TestRow>;
      selectionService.selectedItems.set([DEFAULT_ITEMS[0]]);

      expect(fixture.componentInstance.selectedItemsCount()).toBe(1);
    });
  });
});

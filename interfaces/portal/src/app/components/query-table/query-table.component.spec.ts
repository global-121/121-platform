import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  signal,
  Type,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MenuItem, MessageService } from 'primeng/api';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import {
  QueryTableColumn,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { QueryTableFilterService } from '~/components/query-table/services/query-table-filter.service';
import { QueryTableRowExpansionService } from '~/components/query-table/services/query-table-row-expansion.service';
import { QueryTableSelectionService } from '~/components/query-table/services/query-table-selection.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { TrackingService } from '~/services/tracking.service';
import { Locale } from '~/utils/locale';

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
  standalone: true,
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
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestExpandableCellComponent extends TableCellComponent<
  TestRow,
  TestContext
> {}

class RtlHelperServiceStub {
  createPosition() {
    return signal<'left' | 'right'>('left');
  }

  createRtlFriendlyChevronIcon() {
    return signal('pi pi-chevron-right');
  }
}

class TrackingServiceStub {
  trackEvent = jasmine.createSpy('trackEvent');
}

describe('QueryTableComponent', () => {
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
      const updateSpy = spyOn(
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
      const toggleSpy = spyOn(
        fixture.componentInstance.updateContextMenuItem,
        'emit',
      );

      setComponentInputs({ contextMenuItems: [{ label: 'View' }] });
      fixture.detectChanges();

      const extraOptionsMenu = fixture.componentInstance.extraOptionsMenu();
      if (extraOptionsMenu) {
        spyOn(extraOptionsMenu, 'toggle');
      }

      const item = DEFAULT_ITEMS[0];
      fixture.componentInstance.toggleMoreActionsMenu(new Event('click'), item);

      expect(toggleSpy).toHaveBeenCalledWith(item);
      expect(trackingService.trackEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
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
      const clearTableSpy = spyOn(table, 'clear');
      const resetSelectionSpy = spyOn(selectionService, 'resetSelection');
      const clearAllFiltersSpy = spyOn(
        filterService,
        'clearAllFilters',
      ).and.callThrough();

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
      const getActionDataSpy = spyOn(
        selectionService,
        'getActionData',
      ).and.returnValue(expectedResult);

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

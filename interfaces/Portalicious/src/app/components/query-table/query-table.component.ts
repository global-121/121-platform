import { DatePipe, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  model,
  output,
  signal,
  Type,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FilterMetadata, MenuItem, TableState } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ContextMenuModule } from 'primeng/contextmenu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';

import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import { TableCellChipComponent } from '~/components/query-table/table-cell/table-cell-chip.component';
import { TableCellDateComponent } from '~/components/query-table/table-cell/table-cell-date.component';
import { TableCellTextComponent } from '~/components/query-table/table-cell/table-cell-text.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { Locale } from '~/utils/locale';

export interface QueryTableColumn<TData, TField = keyof TData & string> {
  header: string;
  field: TField;
  hidden?: boolean;
  type?: 'date' | 'multiselect' | 'text'; // defaults to text
  options?: { label: string; value: number | string }[]; // for type 'multiselect'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: Type<TableCellComponent<TData, any>>;
}

@Component({
  selector: 'app-query-table',
  standalone: true,
  imports: [
    TableModule,
    SkeletonModule,
    NgComponentOutlet,
    MenuModule,
    ContextMenuModule,
    ButtonModule,
    DatePipe,
    TableCellDateComponent,
    TableCellTextComponent,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    MultiSelectModule,
    FormsModule,
    SkeletonInlineComponent,
    TableCellChipComponent,
  ],
  templateUrl: './query-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableComponent<TData extends { id: PropertyKey }, TContext> {
  locale = inject<Locale>(LOCALE_ID);

  items = input.required<TData[]>();
  isPending = input.required<boolean>();
  columns = input.required<QueryTableColumn<TData>[]>();
  localStorageKey = input.required<string>();
  contextMenuItems = input<MenuItem[]>();
  globalFilterFields = input<(keyof TData & string)[]>();
  expandableRowTemplate = input<Type<TableCellComponent<TData, TContext>>>();
  tableCellContext = input<TContext>();
  readonly onUpdateContextMenuItem = output<TData>();

  @ViewChild('table') table: Table;
  @ViewChild('contextMenu') contextMenu: Menu;
  @ViewChild('extraOptionsMenu') extraOptionsMenu: Menu;

  visibleColumns = computed(() =>
    this.columns().filter((column) => !column.hidden),
  );

  totalColumnCount = computed(
    () =>
      this.visibleColumns().length +
      (this.contextMenuItems() ? 1 : 0) +
      (this.expandableRowTemplate() ? 1 : 0),
  );

  // This is triggered whenever primeng saves the state of the table to local storage
  // which is an optimal time to update our local state
  onStateSave(event: TableState) {
    this.synchronizeFilters(event);
    this.synchronizeExpandedRowKeys(event);
  }

  /**
   *  FILTERS
   */
  globalFilterValue = model<string>();
  isFiltered = signal(false);

  clearAllFilters() {
    this.table.clear();
    this.globalFilterValue.set('');
    localStorage.removeItem(this.localStorageKey());
    this.isFiltered.set(false);
  }

  synchronizeFilters(event: TableState) {
    if (!event.filters) {
      return;
    }

    // TS thinks this is always defined but it is not true
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (event.filters.global) {
      const globalFilter = Array.isArray(event.filters.global)
        ? event.filters.global[0]
        : event.filters.global;
      if (globalFilter.value && globalFilter.value !== '') {
        // without this, the global filter value is not restored properly from local storage
        this.globalFilterValue.set(globalFilter.value as string);
      }
    }

    this.isFiltered.set(
      // check if any filter is set by checking if any filter has a value
      Object.values(event.filters).some((filterMetadata) => {
        const filterMetadataArray: FilterMetadata[] = Array.isArray(
          filterMetadata,
        )
          ? filterMetadata
          : [filterMetadata];
        return filterMetadataArray.some(
          (filter) => filter.value !== undefined && filter.value !== null,
        );
      }),
    );
  }

  /**
   *  EXPANDABLE ROWS
   */
  expandedRowKeys = signal({});

  expandAll() {
    this.expandedRowKeys.set(
      this.items().reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
    );
  }

  collapseAll() {
    this.expandedRowKeys.set({});
  }

  areAllRowsExpanded = computed(
    () =>
      this.items().length > 0 &&
      this.items().every((item) => this.expandedRowKeys()[item.id] === true),
  );

  synchronizeExpandedRowKeys(event: TableState) {
    if (!event.expandedRowKeys) {
      return;
    }
    this.expandedRowKeys.set({
      // clone to make sure to trigger change detection
      // https://stackoverflow.com/a/77532370
      ...event.expandedRowKeys,
    });
  }

  /**
   *  PAGINATION
   */
  currentPageReportTemplate =
    $localize`:The contents of the square brackets should not be touched/changed:Showing [first] to [last] of [totalRecords] records`
      // this is a workaround because the i18n compiler does not support curly braces in the template
      .replaceAll('[', '{')
      .replaceAll(']', '}');
}

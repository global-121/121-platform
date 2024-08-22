import { DatePipe, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  ViewChild,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateQueryResult } from '@tanstack/angular-query-experimental';
import { FilterMetadata, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ContextMenuModule } from 'primeng/contextmenu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableFilterEvent, TableModule } from 'primeng/table';
import { TableCellDateComponent } from '~/components/query-table/table-cell-date/table-cell-date.component';
import { TableCellTextComponent } from '~/components/query-table/table-cell-text/table-cell-text.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { Locale } from '~/utils/locale';

export interface QueryTableColumn<TData, TField = keyof TData & string> {
  field: TField;
  header: string;
  hidden?: boolean;
  type?: 'date' | 'text'; // defaults to text
  // This property is disabled for now. See usage in template for more information.
  // component?: Type<TableCellComponent<any>>;
}

@Component({
  selector: 'app-query-table',
  standalone: true,
  imports: [
    CardModule,
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
    FormsModule,
    SkeletonInlineComponent,
  ],
  templateUrl: './query-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableComponent<TData> {
  locale = inject<Locale>(LOCALE_ID);

  query = input.required<CreateQueryResult<TData[]>>();
  columns = input.required<QueryTableColumn<TData>[]>();
  localStorageKey = input.required<string>();
  contextMenuItems = input<MenuItem[]>();
  globalFilterFields = input<(keyof TData & string)[]>();
  readonly onUpdateContextMenuItem = output<TData>();

  @ViewChild('table') table: Table;
  @ViewChild('extraOptionsMenu') extraOptionsMenu: Menu;

  currentPageReportTemplate =
    $localize`:The contents of the square brackets should not be touched/changed:Showing [first] to [last] of [totalRecords] records`
      // this is a workaround because the i18n compiler does not support curly braces in the template
      .replaceAll('[', '{')
      .replaceAll(']', '}');

  globalFilterValue = model<string>();
  isFiltered = signal(false);

  visibleColumns = computed(() =>
    this.columns().filter((column) => !column.hidden),
  );

  totalColumnCount = computed(
    () => this.visibleColumns().length + (this.contextMenuItems() ? 1 : 0),
  );

  clearAllFilters() {
    this.table.clear();
    this.globalFilterValue.set('');
    localStorage.removeItem(this.localStorageKey());
    this.isFiltered.set(false);
  }

  onFilter(event: TableFilterEvent) {
    if (!event.filters) {
      return;
    }

    const globalFilter = event.filters.global;
    if (globalFilter?.value && globalFilter.value !== '') {
      // without this, the global filter value is not not restored properly from local storage
      this.globalFilterValue.set(globalFilter.value as string);
    }

    this.isFiltered.set(
      // check if any filter is set by checking if any filter has a value
      Object.values(event.filters).some((filterMetadata) => {
        if (!filterMetadata) {
          return false;
        }
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
}

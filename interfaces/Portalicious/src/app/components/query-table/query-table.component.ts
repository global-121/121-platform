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
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateQueryResult } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ContextMenuModule } from 'primeng/contextmenu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { TableCellDateComponent } from '~/components/query-table/table-cell-date/table-cell-date.component';
import { TableCellTextComponent } from '~/components/query-table/table-cell-text/table-cell-text.component';
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
  ],
  templateUrl: './query-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableComponent<TData> {
  locale = inject<Locale>(LOCALE_ID);

  query = input.required<CreateQueryResult<TData[]>>();
  columns = input.required<QueryTableColumn<TData>[]>();
  contextMenuItems = input<MenuItem[]>();
  globalFilterFields = input<(keyof TData & string)[]>();
  readonly onUpdateContextMenuItem = output<TData>();

  @ViewChild('table') table: Table;
  @ViewChild('extraOptionsMenu') extraOptionsMenu: Menu;

  quickSearchValue = model<string>();

  visibleColumns = computed(() =>
    this.columns().filter((column) => !column.hidden),
  );

  totalColumnCount = computed(
    () => this.visibleColumns().length + (this.contextMenuItems() ? 1 : 0),
  );

  clearAllFilters() {
    this.quickSearchValue.set('');
    this.table.clear();
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';

@Component({
  selector: 'app-table-cell-text',
  standalone: true,
  imports: [],
  template: `{{ value() }}`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellTextComponent implements TableCellComponent<string> {
  value = input.required<string>();
  context = input<never>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';

@Component({
  selector: 'app-table-cell-text',
  standalone: true,
  imports: [],
  templateUrl: './table-cell-text.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellTextComponent implements TableCellComponent<string> {
  value = input.required<string>();
}

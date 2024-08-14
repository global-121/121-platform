import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';

@Component({
  selector: 'app-table-cell-date',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './table-cell-date.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellDateComponent implements TableCellComponent<Date> {
  value = input.required<Date>();
}

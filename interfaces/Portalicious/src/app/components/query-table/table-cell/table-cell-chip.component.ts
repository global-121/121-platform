import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ChipModule } from 'primeng/chip';

import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';

@Component({
  selector: 'app-table-cell-chip',
  standalone: true,
  imports: [ChipModule],
  template: `<p-chip>{{ value() }}</p-chip>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellChipComponent implements TableCellComponent<string> {
  value = input.required<string>();
  context = input<never>();
}

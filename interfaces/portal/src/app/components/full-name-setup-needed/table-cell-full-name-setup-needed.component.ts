import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FullNameSetupNeededChipComponent } from '~/components/full-name-setup-needed/full-name-setup-needed-chip.component';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { Registration } from '~/domains/registration/registration.model';

@Component({
  selector: 'app-table-cell-full-name-setup-needed',
  imports: [FullNameSetupNeededChipComponent],
  template: `<app-full-name-setup-needed-chip />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellFullNameSetupNeededComponent implements TableCellComponent<Registration> {
  readonly value = input.required<Registration>();
  readonly context = input<never>();
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ChipModule } from 'primeng/chip';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByStatusEnum } from '~/components/colored-chip/colored-chip.helper';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
} from '~/domains/registration/registration.model';

@Component({
  selector: 'app-table-cell-overview',
  standalone: true,
  imports: [ChipModule, ColoredChipComponent],
  template: `
    <span class="inline-flex items-center">
      {{ value().overview }}

      @if (chipData()) {
        <app-colored-chip
          [label]="chipData()!.chipLabel"
          [variant]="chipData()!.chipVariant"
          class="ms-2"
        />
      }

      <!-- TODO: AB#30270 add button to open intersolve visa voucher popup -->
    </span>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellOverviewComponent
  implements TableCellComponent<ActivityLogItemWithOverview>
{
  value = input.required<ActivityLogItemWithOverview>();

  chipData = computed(() => {
    const { activityType, contents } = this.value();

    if (activityType !== ActivityLogItemType.Transfer) {
      return;
    }

    return getChipDataByStatusEnum(contents.status);
  });
}

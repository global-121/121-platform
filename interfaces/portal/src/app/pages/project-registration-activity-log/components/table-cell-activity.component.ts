import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import {
  ACTIVITY_LOG_ITEM_TYPE_ICONS,
  ACTIVITY_LOG_ITEM_TYPE_LABELS,
} from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';

@Component({
  selector: 'app-table-cell-activity',
  imports: [],
  template: `
    <span class="inline-flex items-center">
      <span class="me-4 inline leading-[0]"
        ><i [class]="icon() + ' text-xl'"></i>
      </span>
      <span>{{ label() }}</span>
    </span>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellActivityComponent
  implements TableCellComponent<Activity>
{
  readonly value = input.required<Activity>();
  readonly context = input<never>();

  readonly label = computed(
    () => ACTIVITY_LOG_ITEM_TYPE_LABELS[this.value().type],
  );
  readonly icon = computed(
    () => ACTIVITY_LOG_ITEM_TYPE_ICONS[this.value().type],
  );
}

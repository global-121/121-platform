import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import {
  ACTIVITY_LOG_ITEM_TYPE_ICONS,
  ACTIVITY_LOG_ITEM_TYPE_LABELS,
} from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';

@Component({
  selector: 'app-table-cell-activity',
  standalone: true,
  imports: [],
  template: `
    <span class="inline-flex items-center">
      <span class="inline w-8 leading-[0]"
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
  value = input.required<Activity>();
  context = input<never>();

  label = computed(() => ACTIVITY_LOG_ITEM_TYPE_LABELS[this.value().type]);
  icon = computed(() => ACTIVITY_LOG_ITEM_TYPE_ICONS[this.value().type]);
}

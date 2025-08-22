import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { PaymentLogEvent } from '../project-payment-log.page';
import {
  PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS,
  PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS,
} from '~/domains/payment/payment.helpers';

@Component({
  selector: 'app-table-cell-activity',
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
export class TableCellPaymentEventActivityComponent
  implements TableCellComponent<PaymentLogEvent>
{
  readonly value = input.required<PaymentLogEvent>();
  readonly context = input<never>();

  readonly label = computed(
    () => PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS[this.value().type],
  );
  readonly icon = computed(
    () => PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS[this.value().type],
  );
}

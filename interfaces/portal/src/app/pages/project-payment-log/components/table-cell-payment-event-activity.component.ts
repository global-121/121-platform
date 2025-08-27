import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import {
  PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS,
  PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS,
} from '~/domains/payment/payment.helpers';
import { PaymentEventType } from '~/domains/payment/payment.model';

@Component({
  selector: 'app-table-cell-payment-event-activity',
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
  implements TableCellComponent<PaymentEventType>
{
  readonly value = input.required<PaymentEventType>();
  readonly context = input<never>();

  readonly label = computed(
    () => PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS[this.value().type],
  );
  readonly icon = computed(
    () => PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS[this.value().type],
  );
}

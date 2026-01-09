import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import {
  PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS,
  PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS,
} from '~/domains/payment/payment.helpers';
import { PaymentEventType } from '~/domains/payment/payment.model';

@Component({
  selector: 'app-table-cell-payment-event-overview',
  imports: [],
  // TODO: Come up with elegant solution for naming this component + preventing too much duplication for the template/HTML
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
  providers: [DatePipe],
})
export class TableCellPaymentEventOverviewComponent
  implements TableCellComponent<PaymentEventType>
{
  readonly value = input.required<PaymentEventType>();
  readonly context = input<never>();
  readonly datePipe = inject(DatePipe);

  readonly label = computed(() => {
    const event = this.value();
    const eventType = event.type;

    switch (eventType) {
      case PaymentEvent.note:
        return event.attributes.note;
      default:
        return `${PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS[eventType]} ${this.datePipe.transform(event.created, 'short') ?? ''}`;
    }
  });
  readonly icon = computed(
    () => PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS[this.value().type],
  );
}

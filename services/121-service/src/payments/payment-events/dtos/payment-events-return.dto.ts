import { ApiProperty } from '@nestjs/swagger';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventInterface } from '@121-service/src/payments/payment-events/interfaces/payment-event.interface';

class PaymentEventsMetaObject {
  @ApiProperty({
    type: Object,
    example: {
      [PaymentEvent.created]: 1,
      [PaymentEvent.note]: 2,
    },
    description: 'The count of the available payment event types.',
  })
  count: Partial<Record<PaymentEvent, number>>;

  @ApiProperty({
    example: 3,
    description: 'The total number of payment events.',
  })
  total: number;
}

export class PaymentEventsReturnDto {
  @ApiProperty()
  meta: PaymentEventsMetaObject;

  @ApiProperty({
    type: [Object],
    description: 'The payment events data.',
  })
  data: PaymentEventInterface[];
}

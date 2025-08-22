import { ApiProperty } from '@nestjs/swagger';

import { PaymentEventDataDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEventEnum } from '@121-service/src/payments/payment-events/enums/payment-event.enum';

class PaymentEventsMetaObject {
  @ApiProperty({
    type: [String],
    enum: PaymentEventEnum,
    description: 'The available payment event types. Can be 0 or more.',
  })
  availableTypes: PaymentEventEnum[];

  @ApiProperty({
    type: Object,
    example: {
      [PaymentEventEnum.created]: 1,
      [PaymentEventEnum.note]: 2,
    },
    description: 'The count of the available payment event types.',
  })
  count: Partial<Record<PaymentEventEnum, number>>;

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
    type: [PaymentEventDataDto],
    description: 'The payment events data.',
  })
  data: PaymentEventDataDto[];
}

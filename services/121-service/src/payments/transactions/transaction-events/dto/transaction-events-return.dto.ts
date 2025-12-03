import { ApiProperty } from '@nestjs/swagger';

import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventInterface } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event.interface';

class TransactionEventsMetaObject {
  @ApiProperty({
    type: Object,
    example: {
      [TransactionEventType.created]: 1,
      [TransactionEventType.initiated]: 2,
    },
    description: 'The count of the available transaction event types.',
  })
  count: Partial<Record<TransactionEventType, number>>;

  @ApiProperty({
    example: 3,
    description: 'The total number of transaction events.',
  })
  total: number;
}

export class TransactionEventsReturnDto {
  @ApiProperty()
  meta: TransactionEventsMetaObject;

  @ApiProperty({
    type: [Object],
    description: 'The transaction events data.',
  })
  data: TransactionEventInterface[];
}

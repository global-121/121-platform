import { ApiProperty } from '@nestjs/swagger';

import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventInterface } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event.interface';

class TransactionEventsMetaObject {
  @ApiProperty({
    type: Object,
    example: {
      [TransactionEventDescription.created]: 1,
      [TransactionEventDescription.initiated]: 2,
    },
    description: 'The count of the available transaction event descriptions.',
  })
  count: Partial<Record<TransactionEventDescription, number>>;

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

import { ApiProperty } from '@nestjs/swagger';

import { TransactionEventDataDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-event-data.dto';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';

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
    type: [TransactionEventDataDto],
    description: 'The transaction events data.',
  })
  data: TransactionEventDataDto[];
}

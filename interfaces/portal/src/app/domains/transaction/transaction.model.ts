// import { TransactionEventInterface } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-event-data.dto';
import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';

import { Dto } from '~/utils/dto-type';

// TODO: this interface is repeated here instead of importing from 121-service, as that gives lint errors down the line, even though the interfaces are exactly equal
interface TransactionEventInterface {
  id: number;
  user?: {
    id: number;
    username: string;
  };
  created: Date;
  type: TransactionEventType;
  description: TransactionEventDescription;
  errorMessage?: string;
  isSuccessfullyCompleted: boolean;
  programFspConfigurationId: number;
}

export type TransactionEvent = Dto<TransactionEventInterface>;

export type TransactionEventsResponse = {
  data: TransactionEvent[];
} & Dto<Omit<TransactionEventsReturnDto, 'data'>>;

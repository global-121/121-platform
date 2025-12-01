// import { TransactionEventInterface } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-event-data.dto';
import { PaginatedTransactionDto } from '@121-service/src/payments/dto/paginated-transaction.dto';
import { FindAllTransactionsResultDto } from '@121-service/src/payments/transactions/dto/find-all-transactions-result.dto';
import { TransactionEventInterface } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-event-data.dto';
import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';

import { Dto } from '~/utils/dto-type';

export type TransactionEvent = Dto<TransactionEventInterface>;
export type TransactionEventsResponse = {
  data: TransactionEvent[];
} & Dto<Omit<TransactionEventsReturnDto, 'data'>>;

export type Transaction = Dto<PaginatedTransactionDto>;
export type FindAllTransactionsResult = {
  data: Transaction[];
} & Omit<Dto<FindAllTransactionsResultDto>, 'data'>;

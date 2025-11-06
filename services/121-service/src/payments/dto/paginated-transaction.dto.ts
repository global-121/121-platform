import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';

// This type exists to make our frontend happy, as it cannot deal with typeorm types
// It cannot deal with circular type references, such as User → ProgramAssignment → Program → User
export type PaginatedTransactionDto = Omit<
  TransactionViewEntity,
  | 'user'
  | 'registration'
  | 'payment'
  | 'programFspConfiguration'
  | 'transactionEvents'
  | 'lastTransactionEvent'
>;

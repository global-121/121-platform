import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';

export interface SaveTransactionProgressAndRelatedDataContext
  extends TransactionEventCreationContext {
  userId: number; // not nullable in this case
  programId: number;
  referenceId: string;
  isRetry: boolean;
}

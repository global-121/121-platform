import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';

export interface SaveTransactionProgressAndUpdateRegistrationContext
  extends TransactionEventCreationContext {
  userId: number; // not nullable in this context
  referenceId: string;
  programId: number;
  isRetry: boolean;
}

import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';

export interface SaveTransactionProgressAndUpdateRegistrationContext {
  transactionEventContext: TransactionEventCreationContext;
  referenceId: string;
  isRetry: boolean;
}

import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';

export interface TransactionEventInterface {
  id: number;
  user?: {
    id: number;
    username: string;
  } | null;
  created: Date;
  description: TransactionEventDescription;
  errorMessage?: string | null;
  isSuccessfullyCompleted: boolean;
  programFspConfigurationId: number;
}

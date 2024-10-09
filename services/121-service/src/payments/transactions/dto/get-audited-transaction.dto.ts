import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

export interface GetAuditedTransactionDto {
  paymentDate: Date;
  payment: number;
  referenceId: string;
  status: TransactionStatusEnum;
  amount: number;
  errorMessage?: string;
  customData?: string;
  fspName: FinancialServiceProviderName;
  fsp: string;
  fspIntegrationType: string;
  userId: number;
  username: string;
}

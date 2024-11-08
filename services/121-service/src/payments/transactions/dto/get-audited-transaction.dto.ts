import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export interface GetAuditedTransactionDto {
  paymentDate: Date;
  payment: number;
  referenceId: string;
  status: TransactionStatusEnum;
  amount: number;
  errorMessage?: string;
  customData?: string;
  fspName: LocalizedString;
  fsp: FinancialServiceProviders;
  fspIntegrationType: string;
  userId: number;
  username: string;
}

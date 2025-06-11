import { FinancialServiceProviders } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export interface GetAuditedTransactionDto {
  paymentDate: Date;
  updated: Date;
  payment: number;
  referenceId: string;
  status: TransactionStatusEnum;
  amount: number;
  errorMessage?: string;
  customData?: string;
  programFinancialServiceProviderConfigurationLabel: LocalizedString;
  programFinancialServiceProviderConfigurationName: string;
  financialServiceProviderName: FinancialServiceProviders;
  fspIntegrationType: string;
  userId: number;
  username: string;
}

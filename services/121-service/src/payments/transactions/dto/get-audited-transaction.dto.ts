import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export interface GetAuditedTransactionDto {
  paymentDate: Date;
  updated: Date;
  paymentId: number;
  referenceId: string;
  status: TransactionStatusEnum;
  amount: number;
  errorMessage?: string;
  customData?: string;
  projectFspConfigurationLabel: LocalizedString;
  projectFspConfigurationName: string;
  fspName: Fsps;
  fspIntegrationType: string;
  userId: number;
  username: string;
}

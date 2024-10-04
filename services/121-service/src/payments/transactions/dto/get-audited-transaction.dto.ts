import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';

export interface GetAuditedTransactionDto {
  paymentDate: Date;
  payment: number;
  referenceId: string;
  status: StatusEnum;
  amount: number;
  errorMessage?: string;
  customData?: string;
  fspName: FinancialServiceProviderName;
  fsp: string;
  fspIntegrationType: string;
  userId: number;
  username: string;
}

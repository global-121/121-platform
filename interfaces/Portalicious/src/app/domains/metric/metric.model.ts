import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { Dto } from '~/utils/dto-type';

export type ProjectMetrics = Dto<ProgramStats>;

export interface SummaryMetric {
  value: null | number | string | undefined;
  label: string;
  showAlert?: boolean;
}

// Ideally this would be defined in the BE, but it's not
export interface PaymentMetricDetails {
  referenceId: string;
  id: number;
  registrationId: number;
  status: TransactionStatusEnum;
  payment: number;
  errorMessage: null | string;
  amount: number;
  financialserviceprovider: FinancialServiceProviders;
  fullName: string;
}

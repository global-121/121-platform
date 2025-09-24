import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

export interface RetryPaymentJobCreationDetails {
  programFspConfigurationName: string;
  referenceId: string;
  fspName: Fsps;
  transactionAmount: number;
  transactionId?: number;
}

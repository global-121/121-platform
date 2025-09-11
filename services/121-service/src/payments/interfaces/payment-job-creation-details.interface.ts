import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

export interface PaymentJobCreationDetails {
  referenceId: string;
  fspName: Fsps;
  transactionAmount: number;
}

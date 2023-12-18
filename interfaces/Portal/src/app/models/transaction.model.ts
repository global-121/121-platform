import FspName from '../enums/fsp-name.enum';
import { StatusEnum } from './status.enum';
import { IntersolvePayoutStatus } from './transaction-custom-data';

export class Transaction {
  id: number;
  payment: number;
  transaction: number;
  referenceId: string;
  amount: number;
  status: StatusEnum;
  paymentDate: string;
  errorMessage: string;
  customData?:
    | {
        IntersolvePayoutStatus: IntersolvePayoutStatus;
      }
    | any;
  fspName: string;
  fsp: FspName;
}

export class PaymentSummary {
  nrSuccess: number;
  nrWaiting: number;
  nrError: number;
  nrPending?: number;
}

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
}

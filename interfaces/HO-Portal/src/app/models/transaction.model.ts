import { StatusEnum } from './status.enum';

export class Transaction {
  id: number;
  payment: number;
  transaction: number;
  referenceId: string;
  amount: number;
  status: StatusEnum;
  paymentDate: Date;
  error: string;
}

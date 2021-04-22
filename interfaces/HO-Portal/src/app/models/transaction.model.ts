import { StatusEnum } from './status.enum';

export class Transaction {
  id: number;
  installment: number;
  transaction: number;
  referenceId: string;
  amount: number;
  status: StatusEnum;
  installmentDate: Date;
  error: string;
}

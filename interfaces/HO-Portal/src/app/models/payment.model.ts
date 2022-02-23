import { PersonTableColumn } from './person.model';
import { Transaction } from './transaction.model';

export class PaymentData {
  id: number;
  paymentDate: Date;
  amount: number;
}

export class Payment extends PaymentData {
  statusOpen?: boolean;
  isExportAvailable?: boolean;
}

export class PaymentColumn extends PersonTableColumn {
  lastPaymentIndex?: number;
}

export class PaymentColumnDetail {
  text: string;
  lastPaymentIndex?: number;
  payments?: number[];
  amount?: string;
  hasMessageIcon?: boolean;
  hasMoneyIconTable?: boolean;
}

export class PaymentRowDetail {
  text: string;
  lastPaymentIndex?: number;
  amount?: string;
  hasMessageIcon?: boolean;
  hasMoneyIconTable?: boolean;
  transaction?: Transaction;
}

export class PopupPayoutDetails {
  programId: number;
  payment: number;
  amount: number;
  referenceId: string;
  currency: string;
}

export class SinglePayoutDetails {
  paNr: string;
  amount: number;
  currency: string;
  multiplier: number;
  programId: number;
  payment: number;
  referenceId: string;
}

export class TotalTransferAmounts {
  public registrations: number;
  public transferAmounts: number;
}

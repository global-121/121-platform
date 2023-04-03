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

export class PaymentColumnDetail {
  text: string;
  paymentIndex?: number;
  amount?: string;
  hasMessageIcon?: boolean;
  hasMoneyIconTable?: boolean;
  errorMessage?: string;
  status?: string;
}

export class PaymentRowDetail {
  text: string;
  paymentIndex?: number;
  amount?: string;
  hasMessageIcon?: boolean;
  hasMoneyIconTable?: boolean;
  transaction?: Transaction;
  errorMessage?: string;
  waiting?: boolean;
  fsp?: string;
  status?: string;
}

export class PopupPayoutDetails {
  programId: number;
  payment: number;
  amount: number;
  referenceId: string;
  currency: string;
}

export class SinglePayoutDetails {
  paNr: number;
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

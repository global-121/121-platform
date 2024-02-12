import FspName from '../enums/fsp-name.enum';
import { Transaction } from './transaction.model';

export class PaymentData {
  id: number;
  paymentDate: Date;
}

export class Payment extends PaymentData {
  statusOpen?: boolean;
  isExportAvailable?: boolean;
}

export class LastPaymentResults {
  error: number;
  success: number;
  waiting: number;
}

export class PaymentRowDetail {
  text: string;
  sentDate?: string;
  paymentIndex?: number;
  amount?: number;
  currency?: string;
  hasMessageIcon?: boolean;
  hasMoneyIconTable?: boolean;
  transaction?: Transaction;
  errorMessage?: string;
  waiting?: boolean;
  fsp?: FspName;
  status?: string;
  paymentDate?: string;
  user?: any;
}

export class PayoutDetails {
  programId: number;
  payment: number;
  amount: number;
  referenceId: string;
  paNr: number;
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

export enum TransactionCustomDataAttributes {
  intersolveVisaWalletTokenCode = 'intersolveVisaWalletTokenCode',
}

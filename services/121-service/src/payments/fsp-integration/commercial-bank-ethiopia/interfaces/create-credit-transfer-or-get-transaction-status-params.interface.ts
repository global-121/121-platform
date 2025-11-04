import { LocalizedStringForUI } from '@121-service/src/shared/types/localized-string-for-ui.type';

export interface CreateCreditTransferOrGetTransactionStatusParams {
  debitTheirRef: string;
  bankAccountNumber: string;
  currency: string | null;
  ngoName: string | null;
  titlePortal: LocalizedStringForUI | null;
  fullName: string;
  amount: number;
}

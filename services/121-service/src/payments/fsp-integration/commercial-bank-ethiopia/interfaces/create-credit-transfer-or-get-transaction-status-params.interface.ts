import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export interface CreateCreditTransferOrGetTransactionStatusParams {
  debitTheirRef: string;
  bankAccountNumber: string;
  currency: string | null;
  ngoName: string | null;
  titlePortal: LocalizedString | null;
  fullName: string;
  amount: number;
}

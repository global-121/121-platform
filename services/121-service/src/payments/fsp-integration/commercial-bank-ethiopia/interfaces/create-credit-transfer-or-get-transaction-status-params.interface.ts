import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export interface CreateCreditTransferOrGetTransactionStatusParams {
  debitTheirRef: string;
  bankAccountNumber: string;
  currency: string | null;
  ngoName: string | null;
  titlePortal: UILanguageTranslation | null;
  fullName: string;
  amount: number;
}

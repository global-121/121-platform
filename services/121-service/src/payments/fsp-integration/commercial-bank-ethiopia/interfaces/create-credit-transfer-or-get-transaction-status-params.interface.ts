import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';

export interface CreateCreditTransferOrGetTransactionStatusParams {
  debitTheirRef: string;
  bankAccountNumber: string;
  currency: string | null;
  ngoName: string | null;
  titlePortal: UILanguageTranslationPartial | null;
  fullName: string;
  amount: number;
}

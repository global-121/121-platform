import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export interface InstanceReportingProgramRaw {
  id: number;
  titlePortal: UILanguageTranslation | null;
  currency?: CurrencyCode | null;
}

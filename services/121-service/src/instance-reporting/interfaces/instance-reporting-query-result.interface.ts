import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export interface InstanceReportingProgramProjection {
  id: number;
  titlePortal: UILanguageTranslation | null;
}

export interface InstanceReportingRegistrationProjection {
  id: number;
  registrationStatus: RegistrationStatusEnum | null;
  program: InstanceReportingProgramProjection;
}

export interface InstanceReportingTransactionProjection {
  id: number;
  status: string;
  transferValue: number | null;
  created: Date;
  updated: Date;
  registration: {
    id: number;
    referenceId: string;
    program: InstanceReportingProgramProjection & {
      currency: CurrencyCode | null;
    };
  };
}

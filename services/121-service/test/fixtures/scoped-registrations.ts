import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

////////////////////////
// PV registrations
////////////////////////
export const registrationScopedGoesPv = {
  referenceId: 'reference-id-scoped-goes-pv',
  scope: DebugScope.ZeelandGoes,
  preferredLanguage: LanguageEnum.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550111',
  fullName: 'Jane Doe',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationScopedMiddelburgPv = {
  referenceId: 'reference-id-scoped-middelburg-pv',
  scope: DebugScope.ZeelandMiddelburg,
  preferredLanguage: LanguageEnum.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550112',
  fullName: 'Juliet Marsh',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationScopedUtrechtPv = {
  referenceId: 'reference-id-scoped-utrecht-pv',
  preferredLanguage: LanguageEnum.nl,
  scope: DebugScope.UtrechtHouten,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550121',
  fullName: 'Sam Winters',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationNotScopedPv = {
  referenceId: 'reference-id-not-scoped-pv',
  scope: '',
  preferredLanguage: LanguageEnum.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550200',
  fullName: 'Nick Brouwers',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationsPV = [
  registrationScopedMiddelburgPv,
  registrationScopedGoesPv,
  registrationScopedUtrechtPv,
  registrationNotScopedPv,
];

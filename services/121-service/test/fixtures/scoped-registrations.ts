import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

////////////////////////
// PV registrations
////////////////////////
export const registrationScopedKisumuEastPv = {
  referenceId: 'reference-id-scoped-kisumu-east-pv',
  scope: DebugScope.KisumuEast,
  preferredLanguage: RegistrationPreferredLanguage.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550111',
  fullName: 'Jane Doe',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationScopedKisumuWestPv = {
  referenceId: 'reference-id-scoped-kisumu-west-pv',
  scope: DebugScope.KisumuWest,
  preferredLanguage: RegistrationPreferredLanguage.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550112',
  fullName: 'Juliet Marsh',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationScopedTurkanaNorthPv = {
  referenceId: 'reference-id-scoped-turkana-north-pv',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  scope: DebugScope.TurkanaNorth,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550121',
  fullName: 'Sam Winters',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationNotScopedPv = {
  referenceId: 'reference-id-not-scoped-pv',
  scope: '',
  preferredLanguage: RegistrationPreferredLanguage.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550200',
  fullName: 'Nick Brouwers',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationsPV = [
  registrationScopedKisumuWestPv,
  registrationScopedKisumuEastPv,
  registrationScopedTurkanaNorthPv,
  registrationNotScopedPv,
];

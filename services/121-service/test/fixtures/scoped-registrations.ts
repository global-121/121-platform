import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

////////////////////////
// PV registrations
////////////////////////
export const registrationScopedKisumuEastPv = {
  referenceId: 'reference-id-scoped-kisumu-east-pv',
  scope: DebugScope.KisumuEast,
  preferredLanguage: UILanguage.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550111',
  fullName: 'Jane Doe',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationScopedKisumuWestPv = {
  referenceId: 'reference-id-scoped-kisumu-west-pv',
  scope: DebugScope.KisumuWest,
  preferredLanguage: UILanguage.en,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550112',
  fullName: 'Juliet Marsh',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationScopedTurkanaNorthPv = {
  referenceId: 'reference-id-scoped-turkana-north-pv',
  preferredLanguage: UILanguage.nl,
  scope: DebugScope.TurkanaNorth,
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550121',
  fullName: 'Sam Winters',
  programFspConfigurationName: Fsps.intersolveVoucherPaper,
};

export const registrationNotScopedPv = {
  referenceId: 'reference-id-not-scoped-pv',
  scope: '',
  preferredLanguage: UILanguage.en,
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

import { FinancialServiceProviderName } from '../../src/financial-service-provider/enum/financial-service-provider-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { LanguageEnum } from '../../src/registration/enum/language.enum';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';

////////////////////////
// PV registrations
////////////////////////
export const registrationScopedGoesPv = {
  referenceId: 'reference-id-scoped-goes-pv',
  scope: DebugScope.ZeelandGoes,
  preferredLanguage: LanguageEnum.en,
  [CustomDataAttributes.phoneNumber]: '15005550111',
  fullName: 'Jane Doe',
  fspName: FinancialServiceProviderName.intersolveVoucherPaper,
};

export const registrationScopedMiddelburgPv = {
  referenceId: 'reference-id-scoped-middelburg-pv',
  scope: DebugScope.ZeelandMiddelburg,
  preferredLanguage: LanguageEnum.en,
  [CustomDataAttributes.phoneNumber]: '15005550112',
  fullName: 'Juliet Marsh',
  fspName: FinancialServiceProviderName.intersolveVoucherPaper,
};

export const registrationScopedUtrechtPv = {
  referenceId: 'reference-id-scoped-utrecht-pv',
  preferredLanguage: LanguageEnum.nl,
  scope: DebugScope.UtrechtHouten,
  [CustomDataAttributes.phoneNumber]: '15005550121',
  fullName: 'Sam Winters',
  fspName: FinancialServiceProviderName.intersolveVoucherPaper,
};

export const registrationNotScopedPv = {
  referenceId: 'reference-id-not-scoped-pv',
  scope: '',
  preferredLanguage: LanguageEnum.en,
  [CustomDataAttributes.phoneNumber]: '15005550200',
  fullName: 'Nick Brouwers',
  fspName: FinancialServiceProviderName.intersolveVoucherPaper,
};

export const registrationsPV = [
  registrationScopedMiddelburgPv,
  registrationScopedGoesPv,
  registrationScopedUtrechtPv,
  registrationNotScopedPv,
];

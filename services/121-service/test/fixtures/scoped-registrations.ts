import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';

////////////////////////
// PV registrations
////////////////////////
export const registrationScopedGoesPv = {
  referenceId: 'reference-id-scoped-goes-pv',
  scope: DebugScope.ZeelandGoes,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550111',
  fullName: 'Jane Doe',
  fspName: FspName.intersolveVoucherPaper,
};

export const registrationScopedMiddelburgPv = {
  referenceId: 'reference-id-scoped-middelburg-pv',
  scope: DebugScope.ZeelandMiddelburg,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550112',
  fullName: 'Juliet Marsh',
  fspName: FspName.intersolveVoucherPaper,
};

export const registrationScopedUtrechtPv = {
  referenceId: 'reference-id-scoped-utrecht-pv',
  preferredLanguage: 'nl',
  scope: DebugScope.UtrechtHouten,
  [CustomDataAttributes.phoneNumber]: '15005550121',
  fullName: 'Sam Winters',
  fspName: FspName.intersolveVoucherPaper,
};

export const registrationNotScopedPv = {
  referenceId: 'reference-id-not-scoped-pv',
  scope: '',
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550200',
  fullName: 'Nick Brouwers',
  fspName: FspName.intersolveVoucherPaper,
};

export const registrationsPV = [
  registrationScopedMiddelburgPv,
  registrationScopedGoesPv,
  registrationScopedUtrechtPv,
  registrationNotScopedPv,
];

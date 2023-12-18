import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';

////////////////////////
// LVV registrations
////////////////////////
export const registrationScopedGoesLvv = {
  referenceId: 'reference-id-scoped-goes-lvv',
  scope: DebugScope.ZeelandGoes,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550111',
  firstName: 'Jane',
  lastName: 'Doe',
  fspName: FspName.fspNoAttributes,
};

export const registrationScopedMiddelburgLvv = {
  referenceId: 'reference-id-scoped-middelburg-lvv',
  scope: DebugScope.ZeelandMiddelburg,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550112',
  firstName: 'Juliet',
  lastName: 'Marsh',
  fspName: FspName.fspNoAttributes,
};

export const registrationScopedUtrechtLvv = {
  referenceId: 'reference-id-scoped-utrecht-lvv',
  preferredLanguage: 'nl',
  scope: DebugScope.UtrechtHouten,
  [CustomDataAttributes.phoneNumber]: '15005550121',
  firstName: 'Sam',
  lastName: 'Winters',
  fspName: FspName.fspNoAttributes,
};

export const registrationNotScopedLvv = {
  referenceId: 'reference-id-not-scoped-lvv',
  scope: '',
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550200',
  firstName: 'Nick',
  lastName: 'Brouwers',
  fspName: FspName.fspNoAttributes,
};

////////////////////////
// PV registrations
////////////////////////
export const registrationScopedGoesPv = {
  referenceId: 'reference-id-scoped-goes-pv',
  scope: DebugScope.ZeelandGoes,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550111',
  firstName: 'Jane',
  lastName: 'Doe',
  fspName: FspName.fspNoAttributes,
};

export const registrationScopedMiddelburgPv = {
  referenceId: 'reference-id-scoped-middelburg-pv',
  scope: DebugScope.ZeelandMiddelburg,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550112',
  firstName: 'Juliet',
  lastName: 'Marsh',
  fspName: FspName.fspNoAttributes,
};

export const registrationScopedUtrechtPv = {
  referenceId: 'reference-id-scoped-utrecht-pv',
  preferredLanguage: 'nl',
  scope: DebugScope.UtrechtHouten,
  [CustomDataAttributes.phoneNumber]: '15005550121',
  firstName: 'Sam',
  lastName: 'Winters',
  fspName: FspName.fspNoAttributes,
};

export const registrationNotScopedPv = {
  referenceId: 'reference-id-not-scoped-pv',
  scope: '',
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550200',
  firstName: 'Nick',
  lastName: 'Brouwers',
  fspName: FspName.fspNoAttributes,
};

import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';

export const registrationScopedGoes = {
  referenceId: 'reference-id-scoped-goes',
  scope: DebugScope.ZeelandGoes,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550111',
  firstName: 'Jane',
  lastName: 'Doe',
  fspName: FspName.fspNoAttributes,
};

export const registrationScopedMiddelburg = {
  referenceId: 'reference-id-scoped-middelburg',
  scope: DebugScope.ZeelandMiddelburg,
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550112',
  firstName: 'Juliet',
  lastName: 'Marsh',
  fspName: FspName.fspNoAttributes,
};

export const registrationScopedUtrecht = {
  referenceId: 'reference-id-scoped-utrecht',
  preferredLanguage: 'nl',
  scope: DebugScope.UtrechtHouten,
  [CustomDataAttributes.phoneNumber]: '15005550121',
  firstName: 'Sam',
  lastName: 'Winters',
  fspName: FspName.fspNoAttributes,
};

export const registrationNotScoped = {
  referenceId: 'reference-id-not-scoped',
  scope: '',
  preferredLanguage: 'en',
  [CustomDataAttributes.phoneNumber]: '15005550200',
  firstName: 'Nick',
  lastName: 'Brouwers',
  fspName: FspName.fspNoAttributes,
};

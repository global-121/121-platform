import { RegistrationIdentifiers } from '@121-service/src/events/interfaces/registration-identifiers.interface';

export interface CreateForIgnoredDuplicatePair {
  registration1: RegistrationIdentifiers;
  registration2: RegistrationIdentifiers;
  reason: string;
}

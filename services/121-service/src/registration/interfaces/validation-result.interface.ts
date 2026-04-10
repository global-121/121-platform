 import { InvalidRegistration } from '@121-service/src/registration/interfaces/invalid-registration.interface';
import { ValidatedRegistrationInput } from '@121-service/src/registration/interfaces/validated-registration-input.interface';

export interface ValidationResult {
  readonly validRegistrations: ValidatedRegistrationInput[];
  readonly invalidRegistrations: InvalidRegistration[];
}

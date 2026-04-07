import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';
import { ValidatedRegistrationInput } from '@121-service/src/registration/interfaces/validated-registration-input.interface';

export interface ValidationResult {
  readonly validRegistrations: ValidatedRegistrationInput[];
  readonly errors: ValidateRegistrationErrorObject[];
}

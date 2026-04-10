import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';

export interface InvalidRegistration {
  readonly identifier: string | number;
  readonly errors: ValidateRegistrationErrorObject[];
}

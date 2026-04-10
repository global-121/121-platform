import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';

export interface InvalidRegistration {
  readonly referenceId: string | undefined;
  readonly index: number;
  readonly errors: ValidateRegistrationErrorObject[];
}

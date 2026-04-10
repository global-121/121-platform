import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';

export interface InvalidRegistration {
  readonly referenceId: string | undefined;
  readonly lineNumber: number;
  readonly errors: ValidateRegistrationErrorObject[];
}

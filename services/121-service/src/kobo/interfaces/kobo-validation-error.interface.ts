import { KoboValidationErrorType } from '@121-service/src/kobo/enum/kobo-validation-error-type';

/** @public */

export interface KoboValidationError {
  type: KoboValidationErrorType;
  attributeName: string;
  error: string;
  solution: string;
  info?: string;
}

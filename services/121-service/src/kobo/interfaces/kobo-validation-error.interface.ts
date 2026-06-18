import { KoboValidationErrorType } from '@121-service/src/kobo/enum/kobo-validation-error-base';

export interface KoboValidationErrorBase {
  type: KoboValidationErrorType;
  attributeName: string;
  error: string;
  solution: string;
  info?: string;
}

import { ActivityInfoValidationErrorType } from '@121-service/src/activityinfo/enum/activityinfo-validation-error-type';

/** @public */
export interface ActivityInfoValidationError {
  type: ActivityInfoValidationErrorType;
  attributeName: string;
  error: string;
  solution: string;
  info?: string;
}

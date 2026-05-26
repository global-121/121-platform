import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';

// This smells..

// The helper util is created to split the error response of the import registrations endpoint into a single error
// payload that contains either a message or detailed errors. This is because the endpoint can return 3 types of
// different error shapes to the frontend and we want to handle them separately in the UI. The util also handles
// the case where the error response is not in the expected format, which can happen when there is an unexpected
// error on the server.

// Here are the error response formats we handle in the UI for the import file dialog:

// 1. BadRequestException with a message (Example: Program Files -> Validation failed (invalid file type))
// {
//     "message": "Validation failed (invalid file type)",
//     "error": "Bad Request",
//     "statusCode": 400
// }

// 2. Detailed errors format (Example: Registration import -> validation errors in the file)
// [
//   {
//      "column": "referenceId",
//      "value": "00dc9451-1273-484c-b2e8-ae21b51a96ab",
//      "error": "referenceId already exists in database",
//      "referenceId": "00dc9451-1273-484c-b2e8-ae21b51a96ab",
//      "lineNumber": 1
//    },
//    {...},
//    {...},
// ]

// 3. Single string in array error (Example: Registration import -> too many records)
// ['Some error message']

interface ErrorResponse {
  singleErrorMessage: null | string;
  detailedErrors: DetailedImportError[] | null;
}

export interface DetailedImportError extends ValidateRegistrationErrorObject {
  lineNumber?: number;
  id: number;
}

export const ErrorResponseSplitter = (
  failureReason: Error | null,
): ErrorResponse | null => {
  // If there is no failure reason, we return null.
  if (!failureReason) {
    return null;
  }

  const errorResponse: ErrorResponse = {
    singleErrorMessage: null,
    detailedErrors: null,
  };

  const errorPayload = (failureReason.cause as { error: unknown[] }).error;

  // The error does not contain a error array.
  if (!isDetailedImportErrorArray(errorPayload)) {
    // Is it a BadRequestException with a message?
    if ('message' in failureReason) {
      errorResponse.singleErrorMessage = failureReason.message;
    }

    // Is it a array with a single error message?
    if (Array.isArray(errorPayload) && errorPayload.length === 1) {
      errorResponse.singleErrorMessage = errorPayload[0] as string;
    }
  }

  // Well, then the error contains a error array with detailed errors, we want to map them to our DetailedImportError interface and add an id to each error for the UI.
  if (isDetailedImportErrorArray(errorPayload)) {
    errorResponse.detailedErrors = errorPayload.map(
      (error: ValidateRegistrationErrorObject, index) => ({
        ...error,
        id: index,
      }),
    ) as DetailedImportError[];
  }

  return errorResponse;
};

const isDetailedImportErrorArray = (
  errors: unknown[],
): errors is ValidateRegistrationErrorObject[] =>
  errors.length > 0 && typeof errors[0] === 'object' && errors[0] !== null;

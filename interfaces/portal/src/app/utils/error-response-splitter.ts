import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';

// This helper util is created to split the error response of the import registrations endpoint into a single error
// payload that contains either a message or detailed errors. This is because the endpoint can return both types of errors and we want to handle them separately in the UI.
// The util also handles the case where the error response is not in the expected format, which can happen when there is an unexpected error on the server.

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
): ErrorResponse => {
  const errorResponse: ErrorResponse = {
    singleErrorMessage: null,
    detailedErrors: null,
  };

  // If there is no failure reason, we can't split the error, so we return the default error response.
  // This case is unrealistic because if we use this util a error has occurred
  if (!failureReason) {
    return errorResponse;
  }

  const errorPayload = (failureReason.cause as { error: unknown[] }).error;

  if (!isDetailedImportErrorArray(errorPayload)) {
    errorResponse.singleErrorMessage = errorPayload[0] as string;
  }

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

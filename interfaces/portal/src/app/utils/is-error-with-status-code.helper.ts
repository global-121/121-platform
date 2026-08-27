import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export const isErrorWithStatusCode = ({
  error,
  statusCode,
}: {
  error: unknown;
  statusCode: HttpStatusCode;
}) =>
  error instanceof Error &&
  error.cause instanceof HttpErrorResponse &&
  error.cause.status === (statusCode as number);

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- `error.cause.status` is a `number`, but typed as `HttpStatusCode` enum.
  error.cause.status === statusCode;

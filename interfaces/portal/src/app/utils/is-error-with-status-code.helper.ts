import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export const isErrorWithStatusCode = ({
  error,
  statusCode,
}: {
  error: unknown;
  statusCode: HttpStatusCode;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- We want to enforce the use of HttpStatusCode, which is an enum(of numbers only), so we need to cast it explicitly.
  const statusCodeNumber = statusCode as number;

  return (
    error instanceof Error &&
    error.cause instanceof HttpErrorResponse &&
    error.cause.status === statusCodeNumber
  );
};

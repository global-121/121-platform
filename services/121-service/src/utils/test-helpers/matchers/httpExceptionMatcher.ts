import { HttpException, HttpStatus } from '@nestjs/common';

expect.extend({
  toBeHttpExceptionWithStatus(error, expectedStatus: HttpStatus) {
    const isHttpException = error instanceof HttpException;
    const isExpectedStatus = error?.getStatus() === expectedStatus;

    const matchingErrors: string[] = [];
    if (!isHttpException) {
      matchingErrors.push(`expected an instance of HttpException`);
    }
    if (isHttpException && !isExpectedStatus) {
      matchingErrors.push(
        `expected status ${expectedStatus}, but got ${error.getStatus()}`,
      );
    }

    return {
      pass: isHttpException && isExpectedStatus,
      message: () => matchingErrors.join(', '),
    };
  },
});

import { HttpStatus } from '@nestjs/common';

type RepeatAttemptResult<SuccessT, ErrorT> =
  | {
      success: SuccessT;
      error: null;
      statusCode?: HttpStatus;
    }
  | {
      success: null;
      error: ErrorT;
      statusCode?: HttpStatus;
    };

export const repeatAttempt = async <WithArgsT, ResponseT, MaybeErrorT, ErrorT>({
  attemptTo,
  withArgs,
  processResponse,
  retryIf = true, // default: retry until attempts run out
  isError,
  attemptsRemaining,
}: {
  attemptTo: (args: WithArgsT) => Promise<ResponseT>;
  withArgs: WithArgsT;
  processResponse: (response: ResponseT) => MaybeErrorT;
  retryIf?: boolean;
  isError: (maybeError: MaybeErrorT) => boolean;
  attemptsRemaining: number;
}): Promise<RepeatAttemptResult<ResponseT, ErrorT>> => {
  const originalResponse = await attemptTo(withArgs);
  const maybeError = await processResponse(originalResponse);

  if (!isError(maybeError)) {
    return {
      success: originalResponse as unknown as ResponseT,
      error: null,
      statusCode: originalResponse['status'] as HttpStatus,
    };
  }
  const definitelyError = maybeError as unknown as ErrorT;

  // We either don't want to retry or have no attempts left
  if (!retryIf || attemptsRemaining <= 0) {
    return {
      success: null,
      error: definitelyError,
      statusCode: originalResponse['status'] as HttpStatus,
    };
  }
  // Recursion!
  return repeatAttempt({
    attemptTo,
    withArgs,
    processResponse,
    retryIf,
    isError,
    attemptsRemaining: attemptsRemaining - 1,
  });
};

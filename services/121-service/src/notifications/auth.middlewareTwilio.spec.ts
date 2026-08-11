import { HttpStatus } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { env } from '@121-service/src/env';
import { AuthMiddlewareTwilio } from '@121-service/src/notifications/auth.middlewareTwilio';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';

jest.mock('@121-service/src/env', () => ({
  env: { TWILIO_MODE: 'MOCK' },
}));

const mockEnv = env as { TWILIO_MODE: string };

describe('AuthMiddlewareTwilio', () => {
  const middleware = new AuthMiddlewareTwilio();
  const req = {} as Request;
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() when Twilio is in mock mode', async () => {
    mockEnv.TWILIO_MODE = TwilioMode.mock;

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws Unauthorized when Twilio is disabled', async () => {
    mockEnv.TWILIO_MODE = TwilioMode.disabled;

    let caughtError: unknown;
    try {
      await middleware.use(req, res, next);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeHttpExceptionWithStatus(HttpStatus.UNAUTHORIZED);
    expect(next).not.toHaveBeenCalled();
  });
});

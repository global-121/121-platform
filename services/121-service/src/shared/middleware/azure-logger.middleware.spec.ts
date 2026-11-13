import { defaultClient } from 'applicationinsights';
import { EventEmitter } from 'node:events';

import { env } from '@121-service/src/env';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';

jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackTrace: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@121-service/src/env', () => ({
  env: { APPLICATIONINSIGHTS_CONNECTION_STRING: undefined },
}));

describe('Incoming request telemetry', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should preserve the existing trace message on response close', () => {
    // Arrange
    jest.replaceProperty(env, 'APPLICATIONINSIGHTS_CONNECTION_STRING', 'test');
    const middleware = new AzureLoggerMiddleware();
    const next = jest.fn();
    const request = {
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: { reference: 'test' },
      method: 'POST',
      path: '/callback',
    };
    const response = Object.assign(new EventEmitter(), {
      statusCode: 200,
      statusMessage: 'OK',
    });

    // Act
    middleware.use(request as any, response as any, next);
    response.emit('close');

    // Assert
    expect(defaultClient.trackTrace).toHaveBeenCalledWith({
      message:
        'Request: POST /callback from: 127.0.0.1. Request body: {"reference":"test"} - Response: 200 OK}',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should continue without telemetry when no connection string is configured', () => {
    // Arrange
    const middleware = new AzureLoggerMiddleware();
    const next = jest.fn();
    const response = new EventEmitter();

    // Act
    middleware.use({} as any, response as any, next);
    response.emit('close');

    // Assert
    expect(defaultClient.trackTrace).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should report asynchronous flush failures', async () => {
    // Arrange
    jest.replaceProperty(env, 'APPLICATIONINSIGHTS_CONNECTION_STRING', 'test');
    const middleware = new AzureLoggerMiddleware();
    const failure = new Error('Flush rejected');
    jest.mocked(defaultClient.flush).mockRejectedValueOnce(failure);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const response = new EventEmitter();

    // Act
    middleware.use({ headers: {} } as any, response as any, jest.fn());
    response.emit('close');
    await Promise.resolve();

    // Assert
    expect(errorSpy).toHaveBeenCalledWith(
      'An error occurred in AzureLoggerMiddleware::flushLogs:',
      failure,
    );
  });
});

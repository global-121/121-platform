import { defaultClient, KnownSeverityLevel } from 'applicationinsights';

import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

jest.mock('applicationinsights', () => ({
  ...jest.requireActual('applicationinsights'),
  defaultClient: {
    trackException: jest.fn(),
    trackTrace: jest.fn(),
    trackEvent: jest.fn(),
    flush: jest.fn(),
  },
}));
jest.mock('@121-service/src/config', () => ({ IS_PRODUCTION: true }));
jest.mock('@121-service/src/env', () => ({
  env: { APPLICATIONINSIGHTS_CONNECTION_STRING: 'test' },
}));

describe('Application telemetry with default batching', () => {
  let service: AzureLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AzureLogService();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    [false, KnownSeverityLevel.Error],
    [true, KnownSeverityLevel.Critical],
  ])(
    'should retain exception severity for alert=%s without flushing',
    (alert, severity) => {
      // Arrange
      const error = new Error('Application failure');

      // Act
      service.logError(error, alert);

      // Assert
      expect(defaultClient.trackException).toHaveBeenCalledWith({
        exception: error,
        severity,
      });
      expect(defaultClient.flush).not.toHaveBeenCalled();
    },
  );

  it('should retain trace text without flushing', () => {
    // Act
    service.traceAzure('Application trace');

    // Assert
    expect(defaultClient.trackTrace).toHaveBeenCalledWith({
      message: 'Application trace',
    });
    expect(defaultClient.flush).not.toHaveBeenCalled();
  });

  it('should retain custom events and their properties without flushing', () => {
    // Arrange
    const event = {
      name: 'ApplicationEvent',
      properties: { result: 'success' },
    };

    // Act
    service.trackEvent(event);

    // Assert
    expect(defaultClient.trackEvent).toHaveBeenCalledWith(event);
    expect(defaultClient.flush).not.toHaveBeenCalled();
  });

  it('should retain the original exception when no client is available', () => {
    // Arrange
    service.defaultClient = undefined;
    const error = new Error('No telemetry');

    // Act & Assert
    expect(() => service.logError(error, false)).toThrow(error);
  });

  it('should skip traces and events when no client is available', () => {
    // Arrange
    service.defaultClient = undefined;

    // Act
    service.traceAzure('Local trace');
    service.trackEvent({ name: 'LocalEvent', properties: {} });

    // Assert
    expect(defaultClient.trackTrace).not.toHaveBeenCalled();
    expect(defaultClient.trackEvent).not.toHaveBeenCalled();
  });

  it.each(['exception', 'event'])('should report SDK %s failures', (kind) => {
    // Arrange
    const failure = new Error('SDK unavailable');
    if (kind === 'exception') {
      jest.mocked(defaultClient.trackException).mockImplementationOnce(() => {
        throw failure;
      });
    } else {
      jest.mocked(defaultClient.trackEvent).mockImplementationOnce(() => {
        throw failure;
      });
    }

    // Act
    if (kind === 'exception') {
      service.logError(new Error('Application failure'), false);
    } else {
      service.trackEvent({ name: 'ApplicationEvent', properties: {} });
    }

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('An error occurred'),
      failure,
    );
  });
});

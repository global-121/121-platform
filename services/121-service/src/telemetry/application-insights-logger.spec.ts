import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { defaultClient, KnownSeverityLevel } from 'applicationinsights';

import { env } from '@121-service/src/env';
import { ApplicationInsightsLogger } from '@121-service/src/telemetry/application-insights-logger';

jest.mock('applicationinsights', () => ({
  ...jest.requireActual('applicationinsights'),
  defaultClient: {
    trackTrace: jest.fn(),
    trackException: jest.fn(),
    flush: jest.fn(),
  },
}));
jest.mock('@121-service/src/env', () => ({
  env: { APPLICATIONINSIGHTS_CONNECTION_STRING: 'test' },
}));

describe('NestJS application logs', () => {
  const logger = new ApplicationInsightsLogger();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(ConsoleLogger.prototype as any, 'printMessages')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<[LogLevel, KnownSeverityLevel]>([
    ['log', KnownSeverityLevel.Information],
    ['warn', KnownSeverityLevel.Warning],
    ['error', KnownSeverityLevel.Error],
    ['fatal', KnownSeverityLevel.Critical],
    ['debug', KnownSeverityLevel.Verbose],
    ['verbose', KnownSeverityLevel.Verbose],
  ])(
    'should export one %s record with context and severity',
    (level, severity) => {
      // Act
      logger[level]('Application message', 'TestContext');

      // Assert
      expect(defaultClient.trackTrace).toHaveBeenCalledTimes(1);
      expect(defaultClient.trackTrace).toHaveBeenCalledWith({
        message: 'Application message',
        severity,
        properties: { context: 'TestContext', logLevel: level },
      });
      expect(defaultClient.flush).not.toHaveBeenCalled();
    },
  );

  it('should record Error objects as exceptions rather than duplicate traces', () => {
    // Arrange
    const error = new Error('Handled application error');

    // Act
    logger.error(error, 'TestContext');

    // Assert
    expect(defaultClient.trackException).toHaveBeenCalledWith({
      exception: error,
      severity: KnownSeverityLevel.Error,
      properties: { context: 'TestContext', logLevel: 'error' },
    });
    expect(defaultClient.trackTrace).not.toHaveBeenCalled();
  });

  it('should omit objects and structured parameters from exported messages', () => {
    // Act
    logger.log(
      { phone: 'personal-data' },
      { password: 'secret' },
      'TestContext',
    );

    // Assert
    expect(defaultClient.trackTrace).toHaveBeenCalledWith({
      message: 'Non-string NestJS log message omitted',
      severity: KnownSeverityLevel.Information,
      properties: { context: 'TestContext', logLevel: 'log' },
    });
  });

  it('should leave telemetry disabled without a connection string', () => {
    // Arrange
    jest.replaceProperty(
      env,
      'APPLICATIONINSIGHTS_CONNECTION_STRING',
      undefined,
    );

    // Act
    logger.log('Local log');

    // Assert
    expect(defaultClient.trackTrace).not.toHaveBeenCalled();
  });

  it('should report exporter failures without disrupting application logging', () => {
    // Arrange
    const error = new Error('Exporter failed');
    jest.mocked(defaultClient.trackTrace).mockImplementationOnce(() => {
      throw error;
    });
    jest.spyOn(console, 'error').mockImplementation();

    // Act
    logger.warn('Application warning');

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      'Failed to export NestJS log to Application Insights:',
      error,
    );
  });
});

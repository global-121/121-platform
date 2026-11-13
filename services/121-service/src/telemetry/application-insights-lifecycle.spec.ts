import { defaultClient, KnownSeverityLevel } from 'applicationinsights';

import { env } from '@121-service/src/env';
import { APPLICATION_INSIGHTS_SHUTDOWN_TIMEOUT_MS } from '@121-service/src/telemetry/application-insights.const';
import {
  handleFatalError,
  shutdownApplicationInsights,
} from '@121-service/src/telemetry/application-insights-lifecycle';

jest.mock('applicationinsights', () => ({
  ...jest.requireActual('applicationinsights'),
  defaultClient: {
    flush: jest.fn(),
    shutdown: jest.fn(),
    trackException: jest.fn(),
    trackTrace: jest.fn(),
  },
}));
jest.mock('@121-service/src/env', () => ({
  env: { APPLICATIONINSIGHTS_CONNECTION_STRING: 'test' },
}));

describe('Telemetry delivery at shutdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(defaultClient.flush).mockReset().mockResolvedValue();
    jest.mocked(defaultClient.shutdown).mockReset().mockResolvedValue();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should flush before shutting down SDK providers', async () => {
    // Act
    await shutdownApplicationInsights();

    // Assert
    expect(defaultClient.flush).toHaveBeenCalledTimes(1);
    expect(defaultClient.shutdown).toHaveBeenCalledTimes(1);
    expect(
      jest.mocked(defaultClient.flush).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(defaultClient.shutdown).mock.invocationCallOrder[0],
    );
  });

  it('should skip SDK calls when telemetry is disabled', async () => {
    // Arrange
    jest.replaceProperty(
      env,
      'APPLICATIONINSIGHTS_CONNECTION_STRING',
      undefined,
    );

    // Act
    await shutdownApplicationInsights();

    // Assert
    expect(defaultClient.flush).not.toHaveBeenCalled();
    expect(defaultClient.shutdown).not.toHaveBeenCalled();
  });

  it.each(['flush', 'shutdown'] as const)(
    'should report rejected %s operations',
    async (operation) => {
      // Arrange
      const error = new Error('Exporter unavailable');
      jest.mocked(defaultClient[operation]).mockRejectedValueOnce(error);

      // Act
      await shutdownApplicationInsights();

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Application Insights shutdown failed:',
        error,
      );
    },
  );

  it('should bound delivery time when the exporter never resolves', async () => {
    // Arrange
    jest.useFakeTimers();
    jest
      .mocked(defaultClient.flush)
      .mockReturnValueOnce(new Promise(() => undefined));

    // Act
    const shutdown = shutdownApplicationInsights();
    await jest.advanceTimersByTimeAsync(
      APPLICATION_INSIGHTS_SHUTDOWN_TIMEOUT_MS,
    );
    await shutdown;

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      'Application Insights shutdown failed:',
      new Error('Application Insights shutdown timed out'),
    );
    expect(defaultClient.shutdown).not.toHaveBeenCalled();
  });

  it('should record one fatal exception and a restart trace before delivery', async () => {
    // Arrange
    const error = new Error('Fatal application failure');

    // Act
    await handleFatalError({ error });

    // Assert
    expect(defaultClient.trackException).toHaveBeenCalledTimes(1);
    expect(defaultClient.trackException).toHaveBeenCalledWith({
      exception: error,
      severity: KnownSeverityLevel.Critical,
    });
    expect(defaultClient.trackTrace).toHaveBeenCalledWith({
      message: 'Uncaught Exception: restarting',
      severity: KnownSeverityLevel.Critical,
    });
    expect(defaultClient.flush).toHaveBeenCalledTimes(1);
  });

  it('should retain local fatal diagnostics without telemetry', async () => {
    // Arrange
    jest.replaceProperty(
      env,
      'APPLICATIONINSIGHTS_CONNECTION_STRING',
      undefined,
    );
    const error = new Error('Fatal application failure');

    // Act
    await handleFatalError({ error });

    // Assert
    expect(console.error).toHaveBeenCalledWith('Uncaught Exception:', error);
    expect(defaultClient.trackException).not.toHaveBeenCalled();
  });

  it('should still attempt delivery after a fatal tracking error', async () => {
    // Arrange
    const error = new Error('Tracking failed');
    jest.mocked(defaultClient.trackException).mockImplementationOnce(() => {
      throw error;
    });

    // Act
    await handleFatalError({ error: new Error('Fatal failure') });

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      'Failed to record fatal exception:',
      error,
    );
    expect(defaultClient.shutdown).toHaveBeenCalledTimes(1);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

// Mock applicationinsights
jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackException: jest.fn(),
    trackTrace: jest.fn(),
    flush: jest.fn(),
  },
  SeverityLevel: {
    Critical: 4,
    Error: 3,
  },
}));

describe('AzureLogService', () => {
  let service: AzureLogService;
  let mockTelemetryClient: jest.Mocked<TelemetryClient>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  // Helper functions for creating test data
  const createTestError = (message = 'Test error message'): Error => {
    return new Error(message);
  };

  const setupServiceWithClient = (): void => {
    service.defaultClient = mockTelemetryClient;
  };

  const setupServiceWithoutClient = (): void => {
    Object.defineProperty(service, 'defaultClient', {
      get: () => undefined,
      configurable: true,
    });
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const { defaultClient } = await import('applicationinsights');
    mockTelemetryClient = defaultClient as jest.Mocked<TelemetryClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AzureLogService],
    }).compile();

    service = module.get<AzureLogService>(AzureLogService);

    // Set up console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have defaultClient property', () => {
      expect(service).toHaveProperty('defaultClient');
    });
  });

  describe('logError', () => {
    const testError = createTestError();

    describe('when Azure client is available', () => {
      beforeEach(() => {
        setupServiceWithClient();
      });

      it('should log error to Azure with Error severity when alert is false', () => {
        service.logError(testError, false);

        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Logging error to Azure - :',
          testError,
        );
        expect(mockTelemetryClient.trackException).toHaveBeenCalledWith({
          exception: testError,
          severity: SeverityLevel.Error,
        });
        expect(mockTelemetryClient.flush).toHaveBeenCalled();
      });

      it('should log error to Azure with Critical severity when alert is true', () => {
        service.logError(testError, true);

        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Logging error to Azure - :',
          testError,
        );
        expect(mockTelemetryClient.trackException).toHaveBeenCalledWith({
          exception: testError,
          severity: SeverityLevel.Critical,
        });
        expect(mockTelemetryClient.flush).toHaveBeenCalled();
      });

      it('should handle different error types', () => {
        const typeError = new TypeError('Type error message');
        const rangeError = new RangeError('Range error message');

        service.logError(typeError, false);
        service.logError(rangeError, true);

        expect(mockTelemetryClient.trackException).toHaveBeenCalledTimes(2);
        expect(mockTelemetryClient.trackException).toHaveBeenNthCalledWith(1, {
          exception: typeError,
          severity: SeverityLevel.Error,
        });
        expect(mockTelemetryClient.trackException).toHaveBeenNthCalledWith(2, {
          exception: rangeError,
          severity: SeverityLevel.Critical,
        });
      });

      it('should handle trackException errors gracefully', () => {
        const trackError = new Error('Track exception failed');
        const throwingMockImplementation = () => {
          throw trackError;
        };
        mockTelemetryClient.trackException.mockImplementation(
          throwingMockImplementation,
        );

        expect(() => service.logError(testError, false)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in logError:',
          trackError,
        );
        expect(mockTelemetryClient.flush).toHaveBeenCalled();
      });

      it('should handle flush errors gracefully', () => {
        const flushError = new Error('Flush failed');
        mockTelemetryClient.flush.mockImplementation(() => {
          throw flushError;
        });

        expect(() => service.logError(testError, false)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in AzureLogService::flushLogs:',
          flushError,
        );
      });

      it('should handle both trackException and flush errors', () => {
        const trackError = new Error('Track exception failed');
        const flushError = new Error('Flush failed');
        mockTelemetryClient.trackException.mockImplementation(() => {
          throw trackError;
        });
        mockTelemetryClient.flush.mockImplementation(() => {
          throw flushError;
        });

        expect(() => service.logError(testError, false)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in logError:',
          trackError,
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in AzureLogService::flushLogs:',
          flushError,
        );
      });
    });

    describe('when Azure client is not available', () => {
      beforeEach(() => {
        setupServiceWithoutClient();
      });

      it('should throw the original error when defaultClient is not available', () => {
        expect(() => service.logError(testError, false)).toThrow(testError);
      });

      it('should throw the original error regardless of alert parameter', () => {
        expect(() => service.logError(testError, true)).toThrow(testError);
        expect(() => service.logError(testError, false)).toThrow(testError);
      });

      it('should not call Azure client methods when unavailable', () => {
        expect(() => service.logError(testError, false)).toThrow();

        expect(mockTelemetryClient.trackException).not.toHaveBeenCalled();
        expect(mockTelemetryClient.flush).not.toHaveBeenCalled();
      });
    });

    describe('consoleLogAndTraceAzure', () => {
      const testMessage = 'Test log message';

      describe('when Azure client is available', () => {
        beforeEach(() => {
          setupServiceWithClient();
        });

        it('should log to console and track trace in Azure', () => {
          service.consoleLogAndTraceAzure(testMessage);

          expect(consoleLogSpy).toHaveBeenCalledWith(testMessage);
          expect(mockTelemetryClient.trackTrace).toHaveBeenCalledWith({
            message: testMessage,
          });
          expect(mockTelemetryClient.flush).toHaveBeenCalled();
        });

        it('should handle different message types', () => {
          const emptyMessage = '';
          const longMessage = 'A'.repeat(1000);
          const specialCharMessage = 'Message with special chars: !@#$%^&*()';

          service.consoleLogAndTraceAzure(emptyMessage);
          service.consoleLogAndTraceAzure(longMessage);
          service.consoleLogAndTraceAzure(specialCharMessage);

          expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(3);
          expect(mockTelemetryClient.trackTrace).toHaveBeenNthCalledWith(1, {
            message: emptyMessage,
          });
          expect(mockTelemetryClient.trackTrace).toHaveBeenNthCalledWith(2, {
            message: longMessage,
          });
          expect(mockTelemetryClient.trackTrace).toHaveBeenNthCalledWith(3, {
            message: specialCharMessage,
          });
        });

        it('should handle flush errors gracefully', () => {
          const flushError = new Error('Flush failed');
          mockTelemetryClient.flush.mockImplementation(() => {
            throw flushError;
          });

          const testCall = () => service.consoleLogAndTraceAzure(testMessage);
          expect(testCall).not.toThrow();

          expect(consoleLogSpy).toHaveBeenCalledWith(testMessage);
          expect(mockTelemetryClient.trackTrace).toHaveBeenCalledWith({
            message: testMessage,
          });
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'An error occurred in AzureLogService::flushLogs:',
            flushError,
          );
        });
      });

      describe('when Azure client is not available', () => {
        beforeEach(() => {
          setupServiceWithoutClient();
        });

        it('should only log to console when defaultClient is not available', () => {
          service.consoleLogAndTraceAzure(testMessage);

          expect(consoleLogSpy).toHaveBeenCalledWith(testMessage);
          expect(mockTelemetryClient.trackTrace).not.toHaveBeenCalled();
          expect(mockTelemetryClient.flush).not.toHaveBeenCalled();
        });

        it('should always log to console regardless of Azure availability', () => {
          const messages = ['Message 1', 'Message 2', 'Message 3'];

          messages.forEach((message) => {
            service.consoleLogAndTraceAzure(message);
          });

          expect(consoleLogSpy).toHaveBeenCalledTimes(3);
          messages.forEach((message) => {
            expect(consoleLogSpy).toHaveBeenCalledWith(message);
          });
          expect(mockTelemetryClient.trackTrace).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('Integration Tests', () => {
    describe('multiple method interactions with Azure client', () => {
      beforeEach(() => {
        setupServiceWithClient();
      });

      it('should handle multiple consecutive calls correctly', () => {
        const error1 = createTestError('Error 1');
        const error2 = createTestError('Error 2');
        const message = 'Test message';

        service.logError(error1, false);
        service.logError(error2, true);
        service.consoleLogAndTraceAzure(message);

        expect(mockTelemetryClient.trackException).toHaveBeenCalledTimes(2);
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(1);
        expect(mockTelemetryClient.flush).toHaveBeenCalledTimes(3);
      });

      it('should handle interleaved calls correctly', () => {
        const error = createTestError('Interleaved error');
        const message = 'Interleaved message';

        service.consoleLogAndTraceAzure(message);
        service.logError(error, true);
        service.consoleLogAndTraceAzure(message);
        service.logError(error, false);

        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(2);
        expect(mockTelemetryClient.trackException).toHaveBeenCalledTimes(2);
        expect(mockTelemetryClient.flush).toHaveBeenCalledTimes(4);
      });

      it('should maintain consistent behavior with rapid consecutive calls', () => {
        const error = createTestError('Rapid call error');
        const callCount = 10;

        for (let i = 0; i < callCount; i++) {
          service.logError(error, i % 2 === 0);
        }

        expect(mockTelemetryClient.trackException).toHaveBeenCalledTimes(
          callCount,
        );
        expect(mockTelemetryClient.flush).toHaveBeenCalledTimes(callCount);
      });
    });

    describe('state management', () => {
      it('should maintain state correctly across method calls', () => {
        const initialClient = mockTelemetryClient;
        service.defaultClient = initialClient;

        expect(service.defaultClient).toBe(initialClient);

        // Test that methods work with the client
        const testError = createTestError();
        const testCall1 = () => service.logError(testError, false);
        expect(testCall1).not.toThrow();

        // Change state
        Object.defineProperty(service, 'defaultClient', {
          get: () => undefined,
          configurable: true,
        });
        expect(service.defaultClient).toBeUndefined();

        // Test behavior change
        const testCall2 = () => service.logError(testError, false);
        expect(testCall2).toThrow(testError);
      });
    });

    describe('parameter validation with Azure client', () => {
      beforeEach(() => {
        setupServiceWithClient();
      });

      it('should handle null error objects gracefully', () => {
        const nullError = null as any;

        const testCall = () => service.logError(nullError, false);
        expect(testCall).not.toThrow();
        expect(mockTelemetryClient.trackException).toHaveBeenCalledWith({
          exception: nullError,
          severity: SeverityLevel.Error,
        });
      });

      it('should handle empty string messages', () => {
        const emptyMessage = '';

        const testCall = () => service.consoleLogAndTraceAzure(emptyMessage);
        expect(testCall).not.toThrow();
        expect(consoleLogSpy).toHaveBeenCalledWith(emptyMessage);
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledWith({
          message: emptyMessage,
        });
      });
    });
  });
});

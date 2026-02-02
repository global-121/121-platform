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

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const { defaultClient } = await import('applicationinsights');
    mockTelemetryClient = defaultClient as jest.Mocked<TelemetryClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AzureLogService],
    }).compile();

    service = module.get<AzureLogService>(AzureLogService);
  });

  describe('service behavior', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('logError', () => {
      const testError = new Error('Test error message');

      beforeEach(() => {
        // Set up service with defaultClient
        service.defaultClient = mockTelemetryClient;
        // Mock console.log to avoid output during tests
        jest.spyOn(console, 'log').mockImplementation();
      });

      afterEach(() => {
        // Restore console.log
        (console.log as jest.Mock).mockRestore();
      });

      it('should log error to Azure with Error severity when alert is false', () => {
        service.logError(testError, false);

        expect(console.log).toHaveBeenCalledWith(
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

        expect(console.log).toHaveBeenCalledWith(
          'Logging error to Azure - :',
          testError,
        );
        expect(mockTelemetryClient.trackException).toHaveBeenCalledWith({
          exception: testError,
          severity: SeverityLevel.Critical,
        });
        expect(mockTelemetryClient.flush).toHaveBeenCalled();
      });

      it('should throw error when defaultClient is not available', () => {
        service.defaultClient = undefined as any;

        expect(() => service.logError(testError, false)).toThrow(testError);
      });

      it('should handle trackException errors gracefully', () => {
        const trackError = new Error('Track exception failed');
        mockTelemetryClient.trackException.mockImplementation(() => {
          throw trackError;
        });

        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation();

        service.logError(testError, false);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in logError:',
          trackError,
        );
        expect(mockTelemetryClient.flush).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should handle flush errors gracefully', () => {
        const flushError = new Error('Flush failed');
        mockTelemetryClient.flush.mockImplementation(() => {
          throw flushError;
        });

        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation();

        service.logError(testError, false);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in AzureLogService::flushLogs:',
          flushError,
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('consoleLogAndTraceAzure', () => {
      const testMessage = 'Test log message';

      beforeEach(() => {
        // Mock console.log to avoid output during tests
        jest.spyOn(console, 'log').mockImplementation();
      });

      afterEach(() => {
        // Restore console.log
        (console.log as jest.Mock).mockRestore();
      });

      it('should log to console and track trace in Azure when defaultClient is available', () => {
        service.defaultClient = mockTelemetryClient;

        service.consoleLogAndTraceAzure(testMessage);

        expect(console.log).toHaveBeenCalledWith(testMessage);
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledWith({
          message: testMessage,
        });
        expect(mockTelemetryClient.flush).toHaveBeenCalled();
      });

      it('should only log to console when defaultClient is not available', () => {
        service.defaultClient = undefined as any;

        service.consoleLogAndTraceAzure(testMessage);

        expect(console.log).toHaveBeenCalledWith(testMessage);
        expect(mockTelemetryClient.trackTrace).not.toHaveBeenCalled();
        expect(mockTelemetryClient.flush).not.toHaveBeenCalled();
      });

      it('should handle flush errors gracefully', () => {
        service.defaultClient = mockTelemetryClient;
        const flushError = new Error('Flush failed');
        mockTelemetryClient.flush.mockImplementation(() => {
          throw flushError;
        });

        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation();

        service.consoleLogAndTraceAzure(testMessage);

        expect(console.log).toHaveBeenCalledWith(testMessage);
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledWith({
          message: testMessage,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'An error occurred in AzureLogService::flushLogs:',
          flushError,
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('edge cases and integration', () => {
      it('should handle multiple consecutive calls correctly', () => {
        service.defaultClient = mockTelemetryClient;
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');
        const message = 'Test message';

        service.logError(error1, false);
        service.logError(error2, true);
        service.consoleLogAndTraceAzure(message);

        expect(mockTelemetryClient.trackException).toHaveBeenCalledTimes(2);
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(1);
        expect(mockTelemetryClient.flush).toHaveBeenCalledTimes(3);

        consoleLogSpy.mockRestore();
      });

      it('should maintain state correctly across method calls', () => {
        const initialClient = mockTelemetryClient;
        service.defaultClient = initialClient;

        expect(service.defaultClient).toBe(initialClient);

        service.defaultClient = undefined as any;
        expect(service.defaultClient).toBeUndefined();
      });
    });
  });
});

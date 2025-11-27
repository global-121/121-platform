import { Test, TestingModule } from '@nestjs/testing';

import { CronjobExecutionHelperService } from '@121-service/src/cronjob/services/cronjob-execution-helper.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

describe('CronjobExecutionHelperService', () => {
  let service: CronjobExecutionHelperService;
  let azureLogService: AzureLogService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- Suppress console.error globally for cleaner test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronjobExecutionHelperService,
        {
          provide: AzureLogService,
          useValue: { consoleLogAndTraceAzure: jest.fn(), logError: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CronjobExecutionHelperService>(
      CronjobExecutionHelperService,
    );
    azureLogService = module.get<AzureLogService>(AzureLogService);
  });

  afterAll(() => {
    // Restore console.error after all tests
    consoleErrorSpy.mockRestore();
  });

  it('should log correct start and end messages for executeWithLogging', async () => {
    // Act
    await service.executeWithLogging(
      'cronRemoveDeprecatedImageCodes',
      async () => 1,
    );

    // Assert
    expect(azureLogService.consoleLogAndTraceAzure).toHaveBeenCalledTimes(2);

    const startMessage = (azureLogService.consoleLogAndTraceAzure as jest.Mock)
      .mock.calls[0][0];
    const endMessage = (azureLogService.consoleLogAndTraceAzure as jest.Mock)
      .mock.calls[1][0];

    expect(startMessage).toMatch(
      /\[CRON START\].*cronRemoveDeprecatedImageCodes.*started at/,
    );
    expect(endMessage).toMatch(
      /\[CRON END\].*cronRemoveDeprecatedImageCodes.*finished at.*batchSize=1/,
    );
  });

  it('should log error and call logError on failure', async () => {
    // Arrange: Make the function throw
    const error = new Error('Test error');
    const failingFn = jest.fn().mockRejectedValueOnce(error);

    await service.executeWithLogging(
      'cronRemoveDeprecatedImageCodes',
      failingFn,
    );

    // Assert
    expect(azureLogService.consoleLogAndTraceAzure).toHaveBeenCalledTimes(1);
    expect(azureLogService.logError).toHaveBeenCalledTimes(1);

    const errorArg = (azureLogService.logError as jest.Mock).mock.calls[0][0];
    expect(errorArg.message).toMatch(
      /\[CRON END\].*cronRemoveDeprecatedImageCodes.*isError=true/,
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/exchange-rates.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { IntersolveVoucherCronService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';
import { CommercialBankEthiopiaReconciliationService } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.service';
import { IntersolveVisaReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { NedbankReconciliationService } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

describe('CronjobExecutionService', () => {
  let service: CronjobExecutionService;
  let azureLogService: AzureLogService;
  let intersolveVoucherService: IntersolveVoucherService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronjobExecutionService,
        {
          provide: IntersolveVoucherService,
          useValue: {
            removeDeprecatedImageCodes: jest.fn().mockResolvedValue(1),
          },
        },
        { provide: IntersolveVoucherCronService, useValue: {} },
        { provide: IntersolveVoucherReconciliationService, useValue: {} },
        { provide: IntersolveVisaReconciliationService, useValue: {} },
        { provide: CommercialBankEthiopiaReconciliationService, useValue: {} },
        { provide: NedbankReconciliationService, useValue: {} },
        { provide: ExchangeRatesService, useValue: {} },
        {
          provide: AzureLogService,
          useValue: { consoleLogAndTraceAzure: jest.fn(), logError: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CronjobExecutionService>(CronjobExecutionService);
    azureLogService = module.get<AzureLogService>(AzureLogService);
    intersolveVoucherService = module.get<IntersolveVoucherService>(
      IntersolveVoucherService,
    );

    // Suppress console.error for cleaner test output
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  it('should log correct start and end messages for cronRemoveDeprecatedImageCodes', async () => {
    // Act
    await service.cronRemoveDeprecatedImageCodes();

    // Assert
    // The first call is the start message, the second is the end message
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
    // Arrange: Make the service throw
    const error = new Error('Test error');
    jest
      .spyOn(intersolveVoucherService, 'removeDeprecatedImageCodes')
      .mockRejectedValueOnce(error);

    await service.cronRemoveDeprecatedImageCodes();

    // Assert
    expect(azureLogService.consoleLogAndTraceAzure).toHaveBeenCalledTimes(1);
    expect(azureLogService.logError).toHaveBeenCalledTimes(1);

    const errorArg = (azureLogService.logError as jest.Mock).mock.calls[0][0];
    expect(errorArg.message).toMatch(
      /\[CRON END\].*cronRemoveDeprecatedImageCodes.*isError=true/,
    );
  });
});

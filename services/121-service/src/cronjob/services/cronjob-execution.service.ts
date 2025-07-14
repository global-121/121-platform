import { Injectable } from '@nestjs/common';

import { CronjobResults } from '@121-service/src/cronjob/interfaces/cronjob-results.interface';
import { CronjobExecutionMethodName } from '@121-service/src/cronjob/types/cronjob-execution-method-name.type';
import { env } from '@121-service/src/env';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/exchange-rates.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { IntersolveVoucherCronService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';
import { CommercialBankEthiopiaReconciliationService } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.service';
import { IntersolveVisaReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { NedbankReconciliationService } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class CronjobExecutionService {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly intersolveVoucherCronService: IntersolveVoucherCronService,
    private readonly intersolveVoucherReconciliationService: IntersolveVoucherReconciliationService,
    private readonly intersolveVisaReconciliationService: IntersolveVisaReconciliationService,
    private readonly commercialBankEthiopiaReconciliationService: CommercialBankEthiopiaReconciliationService,
    private readonly nedbankReconciliationService: NedbankReconciliationService,
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly azureLogService: AzureLogService,
  ) {}

  public async cronCancelByRefposIntersolve(): Promise<void> {
    await this.executeWithLogging('cronCancelByRefposIntersolve', () =>
      this.intersolveVoucherCronService.cancelByRefposIntersolve(),
    );
  }

  public async cronValidateCommercialBankEthiopiaAccountEnquiries(): Promise<void> {
    await this.executeWithLogging(
      'cronValidateCommercialBankEthiopiaAccountEnquiries',
      () =>
        this.commercialBankEthiopiaReconciliationService.retrieveAndUpsertAccountEnquiries(),
    );
  }

  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    await this.executeWithLogging(
      'cronRetrieveAndUpdatedUnusedIntersolveVouchers',
      () =>
        this.intersolveVoucherReconciliationService.cronRetrieveAndUpdatedUnusedIntersolveVouchers(),
    );
  }

  public async cronRetrieveAndUpdateVisaData(): Promise<void> {
    await this.executeWithLogging('cronRetrieveAndUpdateVisaData', () =>
      this.intersolveVisaReconciliationService.retrieveAndUpdateAllWalletsAndCards(),
    );
  }

  public async cronSendWhatsappReminders(): Promise<void> {
    await this.executeWithLogging('cronSendWhatsappReminders', () =>
      this.intersolveVoucherCronService.sendWhatsappReminders(),
    );
  }

  public async cronDoNedbankReconciliation(): Promise<void> {
    await this.executeWithLogging('cronDoNedbankReconciliation', () =>
      this.nedbankReconciliationService.doNedbankReconciliation(),
    );
  }

  public async cronGetDailyExchangeRates(): Promise<void> {
    await this.executeWithLogging('cronGetDailyExchangeRates', () =>
      this.exchangeRatesService.retrieveAndStoreAllExchangeRates(),
    );
  }

  public async cronRemoveDeprecatedImageCodes(
    mockCurrentDate?: string | undefined,
  ): Promise<number | undefined> {
    return await this.executeWithLogging('cronRemoveDeprecatedImageCodes', () =>
      this.intersolveVoucherService.removeDeprecatedImageCodes(mockCurrentDate),
    );
  }

  private async executeWithLogging(
    methodName: CronjobExecutionMethodName,
    fn: () => Promise<number>,
  ): Promise<number | undefined> {
    const startMessage = this.createCronjobStartMessage(methodName);
    this.azureLogService.consoleLogAndTraceAzure(startMessage);

    try {
      // Execute the cron job function and await its result
      const batchSize = await fn();

      // Handle the result and log the end message
      const cronjobResultMessage = this.createCronjobResultMessage({
        methodName,
        batchSize,
        isError: false,
      });
      this.azureLogService.consoleLogAndTraceAzure(cronjobResultMessage);
      return batchSize;
    } catch (error) {
      // 1. Log the stack trace to the Node logs
      console.error(`Error executing cron job ${methodName}:`, error);

      // 2. Log the cronjob end message to Azure Application Insights and trigger an alert
      const cronjobResultMessage = this.createCronjobResultMessage({
        methodName,
        isError: true,
      });
      this.azureLogService.logError(new Error(cronjobResultMessage), true);
    }
  }

  private createCronjobStartMessage(
    methodName: CronjobExecutionMethodName,
  ): string {
    return `[CRON START] ${env.ENV_NAME} - ${methodName} started at ${new Date().toISOString()}`;
  }

  private createCronjobResultMessage(cronjobResults: CronjobResults): string {
    const { methodName, batchSize, isError } = cronjobResults;
    let message = `[CRON END] ${env.ENV_NAME} - ${methodName} finished at ${new Date().toISOString()}`;
    const details: string[] = [];
    if (typeof batchSize === 'number') {
      details.push(`batchSize=${batchSize}`);
    }
    if (isError) {
      details.push('isError=true');
    }
    if (details.length > 0) {
      message += ` (${details.join(', ')})`;
    }
    return message;
  }
}

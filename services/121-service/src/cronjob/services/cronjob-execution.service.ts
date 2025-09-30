import { Injectable } from '@nestjs/common';

import { CronjobExecutionHelperService } from '@121-service/src/cronjob/services/cronjob-execution-helper.service';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/services/exchange-rates.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { IntersolveVoucherCronService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';
import { CommercialBankEthiopiaReconciliationService } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.service';
import { IntersolveVisaReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { NedbankReconciliationService } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';
import { OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';

@Injectable()
export class CronjobExecutionService {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly intersolveVoucherCronService: IntersolveVoucherCronService,
    private readonly intersolveVoucherReconciliationService: IntersolveVoucherReconciliationService,
    private readonly intersolveVisaReconciliationService: IntersolveVisaReconciliationService,
    private readonly commercialBankEthiopiaReconciliationService: CommercialBankEthiopiaReconciliationService,
    private readonly nedbankReconciliationService: NedbankReconciliationService,
    private readonly onafriqReconciliationService: OnafriqReconciliationService,
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly cronjobExecutionHelperService: CronjobExecutionHelperService,
  ) {}

  public async cronCancelByRefposIntersolve(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronCancelByRefposIntersolve',
      () => this.intersolveVoucherCronService.cancelByRefposIntersolve(),
    );
  }

  public async cronValidateCommercialBankEthiopiaAccountEnquiries(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronValidateCommercialBankEthiopiaAccountEnquiries',
      () =>
        this.commercialBankEthiopiaReconciliationService.retrieveAndUpsertAccountEnquiries(),
    );
  }

  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronRetrieveAndUpdatedUnusedIntersolveVouchers',
      () =>
        this.intersolveVoucherReconciliationService.cronRetrieveAndUpdatedUnusedIntersolveVouchers(),
    );
  }

  public async cronRetrieveAndUpdateVisaData(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronRetrieveAndUpdateVisaData',
      () =>
        this.intersolveVisaReconciliationService.retrieveAndUpdateAllWalletsAndCards(),
    );
  }

  public async cronSendWhatsAppReminders(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronSendWhatsAppReminders',
      () => this.intersolveVoucherCronService.sendWhatsappReminders(),
    );
  }

  public async cronDoNedbankReconciliation(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronDoNedbankReconciliation',
      () => this.nedbankReconciliationService.doNedbankReconciliation(),
    );
  }

  public async cronSendOnafriqReconciliationReport(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronSendOnafriqReconciliationReport',
      () => this.onafriqReconciliationService.sendReconciliationReport(),
    );
  }

  public async cronGetDailyExchangeRates(): Promise<void> {
    await this.cronjobExecutionHelperService.executeWithLogging(
      'cronGetDailyExchangeRates',
      () => this.exchangeRatesService.retrieveAndStoreAllExchangeRates(),
    );
  }

  public async cronRemoveDeprecatedImageCodes(
    mockCurrentDate?: string | undefined,
  ): Promise<number | undefined> {
    return await this.cronjobExecutionHelperService.executeWithLogging(
      'cronRemoveDeprecatedImageCodes',
      () =>
        this.intersolveVoucherService.removeDeprecatedImageCodes(
          mockCurrentDate,
        ),
    );
  }
}

import { Module } from '@nestjs/common';

import { CronjobController } from '@121-service/src/cronjob/cronjob.controller';
import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';
import { CronjobExecutionHelperService } from '@121-service/src/cronjob/services/cronjob-execution-helper.service';
import { CronjobInitiateService } from '@121-service/src/cronjob/services/cronjob-initiate.service';
import { ExchangeRatesModule } from '@121-service/src/exchange-rates/exchange-rates.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { CommercialBankEthiopiaReconciliationModule } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.module';
import { IntersolveVisaReconciliationModule } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.module';
import { IntersolveVoucherReconciliationModule } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.module';
import { NedbankReconciliationModule } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [
    IntersolveVisaReconciliationModule,
    IntersolveVoucherModule,
    IntersolveVoucherReconciliationModule,
    CommercialBankEthiopiaReconciliationModule,
    NedbankReconciliationModule,
    ExchangeRatesModule,
  ],
  providers: [
    CronjobInitiateService,
    CronjobExecutionService,
    CronjobExecutionHelperService,
    AzureLogService,
  ],
  controllers: [CronjobController],
})
export class CronjobModule {}

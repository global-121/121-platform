import { Module } from '@nestjs/common';

import { CronjobController } from '@121-service/src/cronjob/cronjob.controller';
import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';
import { CronjobExecutionHelperService } from '@121-service/src/cronjob/services/cronjob-execution-helper.service';
import { CronjobInitiateService } from '@121-service/src/cronjob/services/cronjob-initiate.service';
import { ExchangeRatesModule } from '@121-service/src/exchange-rates/exchange-rates.module';
import { CommercialBankEthiopiaAccountManagementModule } from '@121-service/src/fsp-integrations/account-management/commercial-bank-ethiopia-account-management/commercial-bank-ethiopia-account-management.module';
import { CooperativeBankOfOromiaAccountManagementModule } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/cooperative-bank-of-oromia-account-management.module';
import { IntersolveVoucherModule } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/intersolve-voucher.module';
import { IntersolveVisaReconciliationModule } from '@121-service/src/fsp-integrations/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.module';
import { IntersolveVoucherReconciliationModule } from '@121-service/src/fsp-integrations/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.module';
import { NedbankReconciliationModule } from '@121-service/src/fsp-integrations/reconciliation/nedbank-reconciliation/nedbank-reconciliation.module';
import { OnafriqReconciliationModule } from '@121-service/src/fsp-integrations/reconciliation/onafriq-reconciliation/onafriq-reconciliation.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [
    IntersolveVisaReconciliationModule,
    IntersolveVoucherModule,
    IntersolveVoucherReconciliationModule,
    CommercialBankEthiopiaAccountManagementModule,
    CooperativeBankOfOromiaAccountManagementModule,
    NedbankReconciliationModule,
    OnafriqReconciliationModule,
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

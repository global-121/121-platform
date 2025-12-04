import { Module } from '@nestjs/common';

import { IntersolveVisaModule } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/intersolve-visa.module';
import { IntersolveVisaReconciliationService as IntersolveVisaReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [IntersolveVisaModule],
  providers: [IntersolveVisaReconciliationService, AzureLogService],
  controllers: [],
  exports: [IntersolveVisaReconciliationService],
})
export class IntersolveVisaReconciliationModule {}

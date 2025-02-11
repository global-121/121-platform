import { Module } from '@nestjs/common';

import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVisaReconciliationController } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.controller';
import { IntersolveVisaReconciliationService as IntersolveVisaReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';

@Module({
  imports: [IntersolveVisaModule],
  providers: [IntersolveVisaReconciliationService],
  controllers: [IntersolveVisaReconciliationController],
})
export class IntersolveVisaReconciliationModule {}

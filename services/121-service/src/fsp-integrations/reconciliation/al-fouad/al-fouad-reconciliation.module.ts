import { Module } from '@nestjs/common';

import { AlFouadModule } from '@121-service/src/fsp-integrations/integrations/al-fouad/al-fouad.module';
import { AlFouadReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/al-fouad/al-fouad-reconciliation.service';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';

@Module({
  imports: [AlFouadModule, TransactionsModule, TransactionEventsModule],
  providers: [AlFouadReconciliationService],
  exports: [AlFouadReconciliationService],
})
export class AlFouadReconciliationModule {}

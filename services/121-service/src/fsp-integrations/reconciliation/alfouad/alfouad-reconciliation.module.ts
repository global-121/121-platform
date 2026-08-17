import { Module } from '@nestjs/common';

import { AlfouadModule } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.module';
import { AlfouadReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/alfouad/alfouad-reconciliation.service';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';

@Module({
  imports: [AlfouadModule, TransactionsModule, TransactionEventsModule],
  providers: [AlfouadReconciliationService],
  exports: [AlfouadReconciliationService],
})
export class AlfouadReconciliationModule {}

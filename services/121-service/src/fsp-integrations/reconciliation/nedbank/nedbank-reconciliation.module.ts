import { Module } from '@nestjs/common';

import { NedbankModule } from '@121-service/src/fsp-integrations/integrations/nedbank/nedbank.module';
import { NedbankReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/nedbank/nedbank-reconciliation.service';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';

@Module({
  imports: [NedbankModule, TransactionsModule, TransactionEventsModule],
  providers: [NedbankReconciliationService],
  exports: [NedbankReconciliationService],
})
export class NedbankReconciliationModule {}

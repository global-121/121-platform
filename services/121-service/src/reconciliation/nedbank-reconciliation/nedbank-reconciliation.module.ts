import { Module } from '@nestjs/common';

import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { NeddbankReconciliationController } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.controller';
import { NedbankReconciliation } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';

@Module({
  imports: [NedbankModule, TransactionsModule],
  providers: [NedbankReconciliation],
  controllers: [NeddbankReconciliationController],
})
export class NedbankReconciliationModule {}

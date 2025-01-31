import { Module } from '@nestjs/common';

import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { NedbankReconciliationController } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.controller';
import { NedbankReconciliationService } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';

@Module({
  imports: [NedbankModule, TransactionsModule],
  providers: [NedbankReconciliationService],
  controllers: [NedbankReconciliationController],
})
export class NedbankReconciliationModule {}

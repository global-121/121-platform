import { Module } from '@nestjs/common';

import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { NedbankReconciliationController } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.controller';
import { NedbankReconciliationService } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';

@Module({
  imports: [NedbankModule, TransactionsModule],
  providers: [NedbankReconciliationService],
  controllers: [NedbankReconciliationController],
})
export class NedbankReconciliationModule {}

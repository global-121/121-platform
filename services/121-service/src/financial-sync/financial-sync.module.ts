import { Module } from '@nestjs/common';

import { FinancialSyncController } from '@121-service/src/financial-sync/financial-sync-controller';
import { FinancialSyncService } from '@121-service/src/financial-sync/financial-sync-service';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';

@Module({
  imports: [NedbankModule, TransactionsModule],
  providers: [FinancialSyncService],
  controllers: [FinancialSyncController],
})
export class FinancialSyncModule {}

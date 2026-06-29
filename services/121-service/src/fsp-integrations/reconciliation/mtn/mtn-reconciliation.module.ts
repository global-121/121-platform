import { Module } from '@nestjs/common';

import { MtnModule } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.module';
import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { TransferReconciliationJobProcessorMtn } from '@121-service/src/fsp-integrations/reconciliation/mtn/processors/mtn-transfer-reconciliation-job.processor';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';

@Module({
  imports: [
    MtnModule,
    RedisModule,
    TransactionsModule,
    TransactionEventsModule,
    ProgramFspConfigurationsModule,
    QueuesRegistryModule,
  ],
  providers: [MtnReconciliationService, TransferReconciliationJobProcessorMtn],
  exports: [MtnReconciliationService],
})
export class MtnReconciliationModule {}

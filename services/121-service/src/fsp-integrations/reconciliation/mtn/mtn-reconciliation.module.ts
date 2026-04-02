import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { MtnReconciliationController } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.controller';
import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { TransferCallbackJobProcessorMtn } from '@121-service/src/fsp-integrations/reconciliation/mtn/processors/mtn-transfer-callback-job.processor';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';

@Module({
  imports: [RedisModule, TransactionsModule, QueuesRegistryModule],
  providers: [MtnReconciliationService, TransferCallbackJobProcessorMtn],
  controllers: [MtnReconciliationController],
  exports: [MtnReconciliationService],
})
export class MtnReconciliationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AzureLoggerMiddleware)
      .forRoutes(MtnReconciliationController);
  }
}

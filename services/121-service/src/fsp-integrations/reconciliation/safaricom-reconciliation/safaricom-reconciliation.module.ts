import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { SafaricomModule } from '@121-service/src/fsp-integrations/api-integrations/safaricom/safaricom.module';
import { TimeoutCallbackJobProcessorSafaricom } from '@121-service/src/fsp-integrations/reconciliation/safaricom-reconciliation/processors/safaricom-timeout-callback-job.processor';
import { TransferCallbackJobProcessorSafaricom } from '@121-service/src/fsp-integrations/reconciliation/safaricom-reconciliation/processors/safaricom-transfer-callback-job.processor';
import { SafaricomReconciliationController } from '@121-service/src/fsp-integrations/reconciliation/safaricom-reconciliation/safaricom-reconciliation.controller';
import { SafaricomReconciliationService as SafaricomReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/safaricom-reconciliation/safaricom-reconciliation.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';

@Module({
  imports: [
    SafaricomModule,
    RedisModule,
    TransactionsModule,
    TransactionEventsModule,
    QueuesRegistryModule,
  ],
  providers: [
    SafaricomReconciliationService,
    TransferCallbackJobProcessorSafaricom,
    TimeoutCallbackJobProcessorSafaricom,
  ],
  controllers: [SafaricomReconciliationController],
  exports: [SafaricomReconciliationService],
})
export class SafaricomReconciliationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AzureLoggerMiddleware)
      .forRoutes(SafaricomReconciliationController);
  }
}

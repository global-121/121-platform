import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { OnafriqReconciliationController } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.controller';
import { OnafriqReconciliationService as OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import { TransactionCallbackJobProcessorOnafriq } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/processors/onafriq-transaction-callback-job.processor';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';

@Module({
  imports: [
    OnafriqModule,
    RedisModule,
    TransactionsModule,
    QueuesRegistryModule,
  ],
  providers: [
    OnafriqReconciliationService,
    TransactionCallbackJobProcessorOnafriq,
  ],
  controllers: [OnafriqReconciliationController],
  exports: [OnafriqReconciliationService],
})
export class OnafriqReconciliationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AzureLoggerMiddleware)
      .forRoutes(OnafriqReconciliationController);
  }
}

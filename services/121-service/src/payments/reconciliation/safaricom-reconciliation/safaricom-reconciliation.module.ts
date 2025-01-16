import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { SafaricomReconciliationController } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.controller';
import { SafaricomReconciliationService as SafaricomReconciliationService } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';

@Module({
  imports: [
    SafaricomModule,
    RedisModule,
    TransactionsModule,
    QueuesRegistryModule,
  ],
  providers: [SafaricomReconciliationService],
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

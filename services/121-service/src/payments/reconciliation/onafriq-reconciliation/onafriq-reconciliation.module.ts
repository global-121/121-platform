import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { OnafriqReconciliationController } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.controller';
import { OnafriqReconciliationService as OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import { TransactionCallbackJobProcessorOnafriq } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/processors/onafriq-transaction-callback-job.processor';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    OnafriqModule,
    RedisModule,
    TransactionsModule,
    QueuesRegistryModule,
    TransactionEventsModule,
  ],
  providers: [
    OnafriqReconciliationService,
    TransactionCallbackJobProcessorOnafriq,
    createScopedRepositoryProvider(OnafriqTransactionEntity),
    createScopedRepositoryProvider(TransactionEventEntity),
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

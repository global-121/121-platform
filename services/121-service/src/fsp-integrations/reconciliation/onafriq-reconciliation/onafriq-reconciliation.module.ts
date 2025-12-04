import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { OnafriqTransactionEntity } from '@121-service/src/fsp-integrations/integrations/onafriq/entities/onafriq-transaction.entity';
import { OnafriqModule } from '@121-service/src/fsp-integrations/integrations/onafriq/onafriq.module';
import { OnafriqReconciliationController } from '@121-service/src/fsp-integrations/reconciliation/onafriq-reconciliation/onafriq-reconciliation.controller';
import { OnafriqReconciliationService as OnafriqReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import { TransactionCallbackJobProcessorOnafriq } from '@121-service/src/fsp-integrations/reconciliation/onafriq-reconciliation/processors/onafriq-transaction-callback-job.processor';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    OnafriqModule,
    RedisModule,
    TransactionsModule,
    QueuesRegistryModule,
    ProgramFspConfigurationsModule,
    ProgramModule,
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

import { EventsModule } from '@121-service/src/events/events.module';
import { FinancialServiceProvidersModule } from '@121-service/src/financial-service-providers/financial-service-provider.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { QueueMessageModule } from '@121-service/src/notifications/queue-message/queue-message.module';
import { QueueNameStoreTransaction } from '@121-service/src/payments/enum/queue.names.enum';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { RedisModule } from '@121-service/src/payments/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { StoreTransactionJobProcessorIntersolveVisa } from '@121-service/src/store-transaction-job-processors/processors/store-transaction-job-intersolve-visa.processor';
import { StoreTransactionJobProcessorsService } from '@121-service/src/store-transaction-job-processors/store-transaction-job-processors.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RedisModule,
    BullModule.registerQueue({
      name: QueueNameStoreTransaction.storeTransactionIntersolveVisa,
      processors: [
        {
          path: 'src/store-transaction-job-processors/processors/store-transaction-job-intersolve-visa.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    IntersolveVisaModule,
    ProgramFinancialServiceProviderConfigurationsModule,
    RegistrationsModule,
    ProgramModule,
    TransactionsModule,
    QueueMessageModule,
    FinancialServiceProvidersModule,
    EventsModule,
    MessageTemplateModule,
  ],
  providers: [
    StoreTransactionJobProcessorsService,
    StoreTransactionJobProcessorIntersolveVisa,
    createScopedRepositoryProvider(TransactionEntity),
  ],
  exports: [StoreTransactionJobProcessorsService],
})
export class StoreTransactionJobProcessorsModule {}

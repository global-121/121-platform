import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utils/registration-utils.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

//TODO: REFACTOR: Rename to TransfersModule
@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, TransactionEntity]),
    UserModule,
    HttpModule,
    ActionsModule,
    MessageQueuesModule,
    MessageTemplateModule,
    RegistrationUtilsModule,
    TransactionEventsModule,
  ],
  providers: [
    TransactionsService,
    TransactionScopedRepository,
    TransactionRepository,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(TransactionEntity),
  ],
  exports: [
    TransactionsService,
    TransactionScopedRepository,
    TransactionRepository,
  ],
})
export class TransactionsModule {}

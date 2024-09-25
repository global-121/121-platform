import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { EventsModule } from '@121-service/src/events/events.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsController } from '@121-service/src/payments/transactions/transactions.controller';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

//TODO: REFACTOR: Rename to TransfersModule
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      LatestTransactionEntity,
      TwilioMessageEntity,
    ]),
    UserModule,
    HttpModule,
    ActionsModule,
    MessageQueuesModule,
    MessageTemplateModule,
    RegistrationUtilsModule,
    EventsModule,
  ],
  providers: [
    TransactionsService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(TransactionEntity),
    LatestTransactionRepository,
  ],
  controllers: [TransactionsController],
  exports: [TransactionsService, LatestTransactionRepository],
})
export class TransactionsModule {}

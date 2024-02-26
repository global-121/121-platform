import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionModule } from '../../actions/action.module';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { MessageTemplateModule } from '../../notifications/message-template/message-template.module';
import { QueueMessageModule } from '../../notifications/queue-message/queue-message.module';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationScopedRepository } from '../../registration/registration-scoped.repository';
import { UserModule } from '../../user/user.module';
import { createScopedRepositoryProvider } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { LatestTransactionEntity } from './latest-transaction.entity';
import { TransactionEntity } from './transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      LatestTransactionEntity,
      FinancialServiceProviderEntity,
      TwilioMessageEntity,
    ]),
    UserModule,
    HttpModule,
    ActionModule,
    QueueMessageModule,
    MessageTemplateModule,
  ],
  providers: [
    TransactionsService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(TransactionEntity),
  ],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}

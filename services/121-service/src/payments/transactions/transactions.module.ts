import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionModule } from '../../actions/action.module';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { UserModule } from '../../user/user.module';
import { UserEntity } from './../../user/user.entity';
import { LatestTransactionEntity } from './latest-transaction.entity';
import { TransactionEntity } from './transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { QueueMessageModule } from '../../notifications/queue-message/queue-message.module';
import { MessageTemplateModule } from '../../notifications/message-template/message-template.module';
import { createScopedRepositoryProvider } from '../../utils/createScopedRepositoryProvider.helper';
import { RegistrationScopedRepository } from '../../registration/registration-scoped.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      LatestTransactionEntity,
      FinancialServiceProviderEntity,
      UserEntity,
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
    createScopedRepositoryProvider(TwilioMessageEntity),
  ],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}

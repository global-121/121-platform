import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionModule } from '../../actions/action.module';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { MessageModule } from '../../notifications/message.module';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { UserModule } from '../../user/user.module';
import { UserEntity } from './../../user/user.entity';
import { LatestTransactionEntity } from './latest-transaction.entity';
import { TransactionEntity } from './transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { MessageTemplateModule } from '../../notifications/message-template/message-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      LatestTransactionEntity,
      RegistrationEntity,
      FinancialServiceProviderEntity,
      UserEntity,
      TwilioMessageEntity,
    ]),
    UserModule,
    HttpModule,
    ActionModule,
    MessageModule,
    MessageTemplateModule,
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}

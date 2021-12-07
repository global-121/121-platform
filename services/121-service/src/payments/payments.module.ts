import { BobFinanceModule } from './fsp-integration/bob-finance/bob-finance.module';
import { UserEntity } from './../user/user.entity';
import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionModule } from '../actions/action.module';
import { FspModule } from '../fsp/fsp.module';
import { ProgramEntity } from '../programs/program.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { UserModule } from '../user/user.module';
import { AfricasTalkingModule } from './fsp-integration/africas-talking/africas-talking.module';
import { BelcashModule } from './fsp-integration/belcash/belcash.module';
import { IntersolveModule } from './fsp-integration/intersolve/intersolve.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TransactionEntity } from './transactions/transaction.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { BulkImportService } from '../registration/services/bulk-import.service';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { InclusionScoreService } from '../registration/services/inclusion-score.service';
import { RegistrationsModule } from '../registration/registrations.module';
import { ProgramAnswerEntity } from '../registration/program-answer.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      RegistrationEntity,
      UserEntity,
      ProgramAnswerEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspAttributeEntity,
    ]),
    UserModule,
    HttpModule,
    ActionModule,
    LookupModule,
    FspModule,
    TransactionsModule,
    IntersolveModule,
    AfricasTalkingModule,
    BelcashModule,
    BobFinanceModule,
    RegistrationsModule,
  ],
  providers: [PaymentsService, BulkImportService, InclusionScoreService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}

import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, HttpModule } from '@nestjs/common';
import { ActionEntity } from '../actions/action.entity';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationEntity } from './registration.entity';
import { ProgramAnswerEntity } from './program-answer.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { SmsModule } from '../notifications/sms/sms.module';
import { InlusionScoreService } from './services/inclusion-score.service';
import { BulkImportService } from './services/bulk-import.service';
import { ActionModule } from '../actions/action.module';
import { ProgramModule } from '../programs/programs.module';
import { FspModule } from '../fsp/fsp.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { RegistrationAnswersService } from './services/registration-answers.service';
import { WhatsappModule } from '../notifications/whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      ActionEntity,
      RegistrationEntity,
      ProgramAnswerEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspAttributeEntity,
      RegistrationStatusChangeEntity,
      TransactionEntity,
    ]),
    UserModule,
    HttpModule,
    LookupModule,
    SmsModule,
    ActionModule,
    ProgramModule,
    FspModule,
    WhatsappModule,
  ],
  providers: [
    RegistrationsService,
    BulkImportService,
    InlusionScoreService,
    RegistrationAnswersService,
  ],
  controllers: [RegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}

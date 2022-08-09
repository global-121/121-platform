import { RegistrationDataEntity } from './registration-data.entity';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, HttpModule } from '@nestjs/common';
import { ActionEntity } from '../actions/action.entity';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationEntity } from './registration.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { SmsModule } from '../notifications/sms/sms.module';
import { InlusionScoreService } from './services/inclusion-score.service';
import { BulkImportService } from './services/bulk-import.service';
import { ActionModule } from '../actions/action.module';
import { ProgramModule } from '../programs/programs.module';
import { FspModule } from '../fsp/fsp.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { WhatsappModule } from '../notifications/whatsapp/whatsapp.module';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      ActionEntity,
      RegistrationEntity,
      RegistrationDataEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspQuestionEntity,
      RegistrationStatusChangeEntity,
      TransactionEntity,
      ProgramCustomAttributeEntity,
      TryWhatsappEntity,
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
  providers: [RegistrationsService, BulkImportService, InlusionScoreService],
  controllers: [RegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}

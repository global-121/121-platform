import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../actions/action.entity';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspModule } from '../fsp/fsp.module';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { MessageModule } from '../notifications/message.module';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { WhatsappPendingMessageEntity } from '../notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVisaModule } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '../payments/fsp-integration/safaricom/safaricom-request.entity';
import { ImageCodeExportVouchersEntity } from '../payments/imagecode/image-code-export-vouchers.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { PersonAffectedAppDataEntity } from '../people-affected/person-affected-app-data.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramModule } from '../programs/programs.module';
import { AzureLogService } from '../shared/services/azure-log.service';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { RegistrationChangeLogEntity } from './modules/registration-change-log/registration-change-log.entity';
import { RegistrationChangeLogModule } from './modules/registration-change-log/registration-change-log.module';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationViewEntity } from './registration-view.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { BulkImportService } from './services/bulk-import.service';
import { InclusionScoreService } from './services/inclusion-score.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      ActionEntity,
      RegistrationEntity,
      RegistrationDataEntity,
      RegistrationChangeLogEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspQuestionEntity,
      RegistrationStatusChangeEntity,
      TransactionEntity,
      ProgramCustomAttributeEntity,
      TryWhatsappEntity,
      PersonAffectedAppDataEntity,
      WhatsappPendingMessageEntity,
      TwilioMessageEntity,
      ImageCodeExportVouchersEntity,
      IntersolveVoucherEntity,
      SafaricomRequestEntity,

      RegistrationViewEntity,
    ]),
    UserModule,
    HttpModule,
    LookupModule,
    ActionModule,
    ProgramModule,
    FspModule,
    MessageModule,
    IntersolveVisaModule,
    RegistrationChangeLogModule,
  ],
  providers: [
    RegistrationsService,
    BulkImportService,
    InclusionScoreService,
    AzureLogService,
  ],
  controllers: [RegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}

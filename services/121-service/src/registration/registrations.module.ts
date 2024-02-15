import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspModule } from '../fsp/fsp.module';
import { NoteEntity } from '../notes/note.entity';
import { LastMessageStatusService } from '../notifications/last-message-status.service';
import { LatestMessageEntity } from '../notifications/latest-message.entity';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { MessageTemplateEntity } from '../notifications/message-template/message-template.entity';
import { QueueMessageModule } from '../notifications/queue-message/queue-message.module';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { WhatsappPendingMessageEntity } from '../notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVisaModule } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '../payments/fsp-integration/safaricom/safaricom-request.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { PersonAffectedAppDataEntity } from '../people-affected/person-affected-app-data.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramModule } from '../programs/programs.module';
import { AzureLogService } from '../shared/services/azure-log.service';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { createScopedRepositoryProvider } from '../utils/scope/createScopedRepositoryProvider.helper';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { RegistrationChangeLogEntity } from './modules/registration-change-log/registration-change-log.entity';
import { RegistrationChangeLogModule } from './modules/registration-change-log/registration-change-log.module';
import { RegistrationDataModule } from './modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from './modules/registration-utilts.module.ts/registration-utils.module';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationScopedRepository } from './repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from './repositories/registration-view-scoped.repository';
import { InclusionScoreService } from './services/inclusion-score.service';
import { RegistrationsBulkHelperService } from './services/registrations-bulk-helper.service';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { RegistrationsImportService } from './services/registrations-import.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProgramEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspQuestionEntity,
      TryWhatsappEntity,
      ProgramCustomAttributeEntity,
      RegistrationEntity,
      LatestMessageEntity,
      PersonAffectedAppDataEntity,
      WhatsappPendingMessageEntity,
      MessageTemplateEntity,
    ]),
    UserModule,
    HttpModule,
    LookupModule,
    ActionModule,
    ProgramModule,
    FspModule,
    QueueMessageModule,
    IntersolveVisaModule,
    RegistrationChangeLogModule,
    RegistrationDataModule,
    RegistrationUtilsModule,
  ],
  providers: [
    RegistrationsService,
    RegistrationsImportService,
    InclusionScoreService,
    AzureLogService,
    RegistrationsPaginationService,
    LastMessageStatusService,
    RegistrationsBulkService,
    RegistrationScopedRepository,
    RegistrationViewScopedRepository,
    RegistrationsBulkHelperService,
    createScopedRepositoryProvider(RegistrationStatusChangeEntity),
    createScopedRepositoryProvider(SafaricomRequestEntity),
    createScopedRepositoryProvider(IntersolveVoucherEntity),
    createScopedRepositoryProvider(RegistrationChangeLogEntity),
    createScopedRepositoryProvider(TwilioMessageEntity),
    createScopedRepositoryProvider(RegistrationDataEntity),
    createScopedRepositoryProvider(NoteEntity),
    createScopedRepositoryProvider(TransactionEntity),
  ],
  controllers: [RegistrationsController],
  exports: [
    RegistrationsService,
    RegistrationsBulkService,
    RegistrationsPaginationService,
    RegistrationsImportService,
  ],
})
export class RegistrationsModule {}

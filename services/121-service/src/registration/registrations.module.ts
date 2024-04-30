import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsModule } from '../actions/actions.module';
import { EventEntity } from '../events/entities/event.entity';
import { EventsModule } from '../events/events.module';
import { FinancialServiceProviderEntity } from '../financial-service-provider/financial-service-provider.entity';
import { FspQuestionEntity } from '../financial-service-provider/fsp-question.entity';
import { FinancialServiceProviderModule } from '../financial-service-provider/financial-service-provider.module';
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
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramModule } from '../programs/programs.module';
import { AzureLogService } from '../shared/services/azure-log.service';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { FileImportService } from '../utils/file-import/file-import.service';
import { createScopedRepositoryProvider } from '../utils/scope/createScopedRepositoryProvider.helper';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { QueueRegistrationUpdateModule } from './modules/queue-registrations-update/queue-registrations-update.module';
import { RegistrationDataModule } from './modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from './modules/registration-utilts/registration-utils.module';
import { RegistrationUpdateProcessor } from './processsors/registrations-update.processor';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationScopedRepository } from './repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from './repositories/registration-view-scoped.repository';
import { InclusionScoreService } from './services/inclusion-score.service';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { RegistrationsImportService } from './services/registrations-import.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';
import { RegistrationsInputValidator } from './validators/registrations-input-validator';

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
      WhatsappPendingMessageEntity,
      MessageTemplateEntity,
    ]),
    UserModule,
    HttpModule,
    LookupModule,
    ActionsModule,
    ProgramModule,
    FinancialServiceProviderModule,
    QueueMessageModule,
    IntersolveVisaModule,
    RegistrationDataModule,
    RegistrationUtilsModule,
    EventsModule,
    QueueRegistrationUpdateModule,
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
    FileImportService,
    RegistrationUpdateProcessor,
    RegistrationsInputValidator,
    createScopedRepositoryProvider(SafaricomRequestEntity),
    createScopedRepositoryProvider(IntersolveVoucherEntity),
    createScopedRepositoryProvider(TwilioMessageEntity),
    createScopedRepositoryProvider(RegistrationDataEntity),
    createScopedRepositoryProvider(NoteEntity),
    createScopedRepositoryProvider(TransactionEntity),
    createScopedRepositoryProvider(EventEntity),
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

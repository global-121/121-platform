import { ActionsModule } from '@121-service/src/actions/actions.module';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventsModule } from '@121-service/src/events/events.module';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProvidersModule } from '@121-service/src/financial-service-providers/financial-service-provider.module';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { LastMessageStatusService } from '@121-service/src/notifications/last-message-status.service';
import { LatestMessageEntity } from '@121-service/src/notifications/latest-message.entity';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { QueueMessageModule } from '@121-service/src/notifications/queue-message/queue-message.module';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-transfer.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueueRegistrationUpdateModule } from '@121-service/src/registration/modules/queue-registrations-update/queue-registrations-update.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationUpdateProcessor } from '@121-service/src/registration/processsors/registrations-update.processor';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsController } from '@121-service/src/registration/registrations.controller';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserModule } from '@121-service/src/user/user.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
    FinancialServiceProvidersModule,
    QueueMessageModule,
    IntersolveVisaModule,
    RegistrationDataModule,
    RegistrationUtilsModule,
    EventsModule,
    QueueRegistrationUpdateModule,
    ProgramFinancialServiceProviderConfigurationsModule,
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
    createScopedRepositoryProvider(SafaricomTransferEntity),
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
    RegistrationScopedRepository,
  ],
})
export class RegistrationsModule {}

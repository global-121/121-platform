import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DebitCardsIntersolveVisaModule } from '@121-service/src/debit-cards-intersolve-visa/debit-cards-intersolve-visa.module';
import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { LatestMessageEntity } from '@121-service/src/notifications/entities/latest-message.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { LastMessageStatusService } from '@121-service/src/notifications/services/last-message-status.service';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { UniqueRegistrationPairEntity } from '@121-service/src/registration/entities/unique-registration-pair.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utils/registration-utils.module';
import { RegistrationsController } from '@121-service/src/registration/registrations.controller';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { UniqueRegistrationPairRepository } from '@121-service/src/registration/repositories/unique-registration-pair.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/services/queue-registrations-update.service';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventsModule } from '@121-service/src/registration-events/registration-events.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserModule } from '@121-service/src/user/user.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProgramEntity,
      TryWhatsappEntity,
      RegistrationEntity,
      LatestMessageEntity,
      WhatsappPendingMessageEntity,
      MessageTemplateEntity,
      ProgramRegistrationAttributeEntity,
      UniqueRegistrationPairEntity,
    ]),
    UserModule,
    HttpModule,
    LookupModule,
    ProgramModule,
    FspsModule,
    MessageQueuesModule,
    RegistrationDataModule,
    RegistrationUtilsModule,
    RegistrationEventsModule,
    ProgramFspConfigurationsModule,
    QueuesRegistryModule,
    MessageTemplateModule,
    DebitCardsIntersolveVisaModule,
  ],
  providers: [
    RegistrationsService,
    RegistrationsImportService,
    InclusionScoreService,
    AzureLogService,
    RegistrationsPaginationService,
    LastMessageStatusService,
    RegistrationsBulkService,
    QueueRegistrationUpdateService,
    RegistrationScopedRepository,
    RegistrationViewScopedRepository,
    FileImportService,
    RegistrationsInputValidator,
    createScopedRepositoryProvider(IntersolveVoucherEntity),
    createScopedRepositoryProvider(TwilioMessageEntity),
    createScopedRepositoryProvider(RegistrationAttributeDataEntity),
    createScopedRepositoryProvider(NoteEntity),
    createScopedRepositoryProvider(TransactionEntity),
    createScopedRepositoryProvider(RegistrationEventEntity),
    UniqueRegistrationPairRepository,
  ],
  controllers: [RegistrationsController],
  exports: [
    RegistrationsService,
    RegistrationsBulkService,
    RegistrationsPaginationService,
    RegistrationsImportService,
    RegistrationScopedRepository,
    RegistrationViewScopedRepository,
  ],
})
export class RegistrationsModule {}

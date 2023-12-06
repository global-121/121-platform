import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../actions/action.entity';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspModule } from '../fsp/fsp.module';
import { LastMessageStatusService } from '../notifications/last-message-status.service';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { WhatsappPendingMessageEntity } from '../notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVisaModule } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '../payments/fsp-integration/safaricom/safaricom-request.entity';
import { ImageCodeExportVouchersEntity } from '../payments/imagecode/image-code-export-vouchers.entity';
import { LatestTransactionEntity } from '../payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { PersonAffectedAppDataEntity } from '../people-affected/person-affected-app-data.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
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
import {
  RegistrationScopedRepository,
  RegistrationViewScopedRepository,
} from './registration-scoped.repository';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { InclusionScoreService } from './services/inclusion-score.service';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { RegistrationsImportService } from './services/registrations-import.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';
import { QueueMessageModule } from '../notifications/queue-message/queue-message.module';
import { LatestMessageEntity } from '../notifications/latest-message.entity';
import { createScopedRepositoryProvider } from '../utils/createScopedRepositoryProvider.helper';

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
      LatestTransactionEntity,
      LatestMessageEntity,
      ProgramAidworkerAssignmentEntity,
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
    createScopedRepositoryProvider(RegistrationStatusChangeEntity),
  ],
  controllers: [RegistrationsController],
  exports: [
    RegistrationsService,
    RegistrationsBulkService,
    RegistrationsPaginationService,
  ],
})
export class RegistrationsModule {}

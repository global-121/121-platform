import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/entities/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/entities/intersolve-voucher.entity';
import { IntersolveVoucherInstructionsEntity } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/entities/intersolve-voucher-instructions.entity';
import { IntersolveVoucherController } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/intersolve-voucher.controller';
import { IntersolveVoucherMockService } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/intersolve-voucher.mock';
import { IntersolveVoucherApiService } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/services/intersolve-voucher.api.service';
import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/services/intersolve-voucher.service';
import { IntersolveVoucherCronService } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/services/intersolve-voucher-cron.service';
import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ImageCodeModule } from '@121-service/src/payments/imagecode/image-code.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utils/registration-utils.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      IntersolveIssueVoucherRequestEntity,
      IntersolveVoucherInstructionsEntity,
      RegistrationEntity,
      TransactionEntity,
      ProgramEntity,
      ProgramFspConfigurationEntity,
      ProgramAidworkerAssignmentEntity,
      IntersolveVoucherEntity,
      TwilioMessageEntity,
    ]),
    ImageCodeModule,
    UserModule,
    TransactionsModule,
    TransactionEventsModule,
    MessageQueuesModule,
    MessageTemplateModule,
    RegistrationDataModule,
    RegistrationUtilsModule,
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    AzureLogService,
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    SoapService,
    IntersolveVoucherMockService,
    IntersolveVoucherCronService,
    CustomHttpService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(IntersolveVoucherEntity),
    ProgramFspConfigurationRepository,
  ],
  controllers: [IntersolveVoucherController],
  exports: [
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    IntersolveVoucherMockService,
    IntersolveVoucherCronService,
  ],
})
export class IntersolveVoucherModule {}

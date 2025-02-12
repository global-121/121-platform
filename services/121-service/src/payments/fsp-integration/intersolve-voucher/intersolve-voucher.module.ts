import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { IntersolveVoucherApiService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/instersolve-voucher.api.service';
import { IntersolveVoucherMockService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/instersolve-voucher.mock';
import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherController } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.controller';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { IntersolveVoucherInstructionsEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher-instructions.entity';
import { PaymentProcessorIntersolveVoucher } from '@121-service/src/payments/fsp-integration/intersolve-voucher/processors/intersolve-voucher.processor';
import { IntersolveVoucherCronService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';
import { ImageCodeModule } from '@121-service/src/payments/imagecode/image-code.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProjectFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/project-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProjectEntity } from '@121-service/src/programs/project.entity';
import { ProjectAidworkerAssignmentEntity } from '@121-service/src/programs/project-aidworker.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
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
      ProjectEntity,
      ProjectFinancialServiceProviderConfigurationEntity,
      ProjectAidworkerAssignmentEntity,
      IntersolveVoucherEntity,
    ]),
    ImageCodeModule,
    UserModule,
    TransactionsModule,
    MessageQueuesModule,
    MessageTemplateModule,
    RegistrationDataModule,
    RegistrationUtilsModule,
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    SoapService,
    IntersolveVoucherMockService,
    IntersolveVoucherCronService,
    CustomHttpService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(IntersolveVoucherEntity),
    PaymentProcessorIntersolveVoucher,
    ProgramFinancialServiceProviderConfigurationRepository,
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

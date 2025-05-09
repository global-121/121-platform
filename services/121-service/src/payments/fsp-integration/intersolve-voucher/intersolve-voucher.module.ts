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
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
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
      ProgramFinancialServiceProviderConfigurationEntity,
      ProgramAidworkerAssignmentEntity,
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
    AzureLogService,
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

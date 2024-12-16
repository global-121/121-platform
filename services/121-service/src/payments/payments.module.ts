import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FinancialServiceProvidersModule } from '@121-service/src/financial-service-providers/financial-service-provider.module';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { CommercialBankEthiopiaModule } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { PaymentsController } from '@121-service/src/payments/payments.controller';
import { PaymentsService } from '@121-service/src/payments/payments.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { TransactionQueuesModule } from '@121-service/src/transaction-queues/transaction-queues.module';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      RegistrationEntity,
      ProgramRegistrationAttributeEntity,
    ]),
    UserModule,
    HttpModule,
    ActionsModule,
    IntersolveVoucherModule,
    // TODO: REFACTOR: Remove IntersolveVisaModule after refactoring financialServiceProviderNameToServiceMap in the payments service
    IntersolveVisaModule,
    TransactionsModule,
    SafaricomModule,
    NedbankModule,
    ExcelModule,
    CommercialBankEthiopiaModule,
    RegistrationsModule,
    ProgramModule,
    RegistrationUtilsModule,
    RegistrationDataModule,
    TransactionQueuesModule,
    FinancialServiceProvidersModule,
    ProgramFinancialServiceProviderConfigurationsModule,
    RedisModule,
  ],
  providers: [
    PaymentsService,
    LookupService,
    InclusionScoreService,
    RegistrationScopedRepository,
    AzureLogService,
    createScopedRepositoryProvider(RegistrationAttributeDataEntity),
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}

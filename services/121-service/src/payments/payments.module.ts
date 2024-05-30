import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { AfricasTalkingModule } from '@121-service/src/payments/fsp-integration/africas-talking/africas-talking.module';
import { BelcashModule } from '@121-service/src/payments/fsp-integration/belcash/belcash.module';
import { BobFinanceModule } from '@121-service/src/payments/fsp-integration/bob-finance/bob-finance.module';
import { CommercialBankEthiopiaModule } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { IntersolveJumboModule } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/intersolve-jumbo.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { UkrPoshtaModule } from '@121-service/src/payments/fsp-integration/ukrposhta/ukrposhta.module';
import { VodacashModule } from '@121-service/src/payments/fsp-integration/vodacash/vodacash.module';
import { PaymentsController } from '@121-service/src/payments/payments.controller';
import { PaymentsService } from '@121-service/src/payments/payments.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserModule } from '@121-service/src/user/user.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      RegistrationEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspQuestionEntity,
      ProgramCustomAttributeEntity,
    ]),
    UserModule,
    HttpModule,
    ActionsModule,
    IntersolveVoucherModule,
    IntersolveVisaModule,
    IntersolveJumboModule,
    AfricasTalkingModule,
    BelcashModule,
    TransactionsModule,
    BobFinanceModule,
    UkrPoshtaModule,
    VodacashModule,
    SafaricomModule,
    ExcelModule,
    CommercialBankEthiopiaModule,
    OnafriqModule,
    RegistrationsModule,
    ProgramModule,
    RegistrationUtilsModule,
    RegistrationDataModule,
  ],
  providers: [
    PaymentsService,
    LookupService,
    InclusionScoreService,
    RegistrationScopedRepository,
    FileImportService,
    AzureLogService,
    createScopedRepositoryProvider(RegistrationDataEntity),
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { AirtelModule } from '@121-service/src/payments/fsp-integration/airtel/airtel.module';
import { CommercialBankEthiopiaModule } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { PaymentEventsModule } from '@121-service/src/payments/payment-events/payment-events.module';
import { PaymentsController } from '@121-service/src/payments/payments.controller';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments.helper.service';
import { PaymentsService } from '@121-service/src/payments/services/payments.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
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
      PaymentEntity,
    ]),
    UserModule,
    HttpModule,
    ActionsModule,
    IntersolveVoucherModule,
    // TODO: REFACTOR: Remove IntersolveVisaModule after refactoring fspNameToServiceMap in the payments service
    IntersolveVisaModule,
    TransactionsModule,
    SafaricomModule,
    AirtelModule,
    NedbankModule,
    OnafriqModule,
    ExcelModule,
    CommercialBankEthiopiaModule,
    RegistrationsModule,
    ProgramModule,
    RegistrationUtilsModule,
    RegistrationDataModule,
    TransactionQueuesModule,
    FspsModule,
    ProgramFspConfigurationsModule,
    RedisModule,
    PaymentEventsModule,
  ],
  providers: [
    PaymentsService,
    PaymentsHelperService,
    LookupService,
    InclusionScoreService,
    AzureLogService,
    createScopedRepositoryProvider(RegistrationAttributeDataEntity),
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { PaymentEventsModule } from '@121-service/src/payments/payment-events/payment-events.module';
import { PaymentsController } from '@121-service/src/payments/payments.controller';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { PaymentsExcelFspService } from '@121-service/src/payments/services/payments-excel-fsp.service';
import { PaymentsExecutionService } from '@121-service/src/payments/services/payments-execution.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utilts/registration-utils.module';
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
    TransactionsModule,
    ExcelModule,
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
    PaymentsExecutionService,
    PaymentsReportingService,
    PaymentsReportingHelperService,
    PaymentsProgressHelperService,
    TransactionJobsCreationService,
    PaymentsExcelFspService,
    LookupService,
    InclusionScoreService,
    AzureLogService,
    createScopedRepositoryProvider(RegistrationAttributeDataEntity),
  ],
  controllers: [PaymentsController],
  exports: [
    PaymentsExecutionService,
    PaymentsReportingService,
    PaymentsProgressHelperService,
  ],
})
export class PaymentsModule {}

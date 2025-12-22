import { HttpModule } from '@nestjs/axios';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FSP_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const';
import { TransactionQueuesModule } from '@121-service/src/fsp-integrations/transaction-queues/transaction-queues.module';
import { FspsModule } from '@121-service/src/fsp-management/fsp.module';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentEventsModule } from '@121-service/src/payments/payment-events/payment-events.module';
import { PaymentsController } from '@121-service/src/payments/payments.controller';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { FspEnvVariableValidationService } from '@121-service/src/payments/services/fsp-env-variable-validation.service';
import { PaymentsCreationService } from '@121-service/src/payments/services/payments-creation.service';
import { PaymentsExecutionService } from '@121-service/src/payments/services/payments-execution.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsModule } from '@121-service/src/registration/modules/registration-utils/registration-utils.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationEventsModule } from '@121-service/src/registration-events/registration-events.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, PaymentEntity]),
    UserModule,
    HttpModule,
    TransactionsModule,
    RegistrationsModule,
    ProgramModule,
    RegistrationUtilsModule,
    RegistrationDataModule,
    TransactionQueuesModule,
    FspsModule,
    ProgramFspConfigurationsModule,
    RedisModule,
    PaymentEventsModule,
    RegistrationEventsModule,
    TransactionEventsModule,
    MessageTemplateModule,
  ],
  providers: [
    PaymentsCreationService,
    PaymentsExecutionService,
    PaymentsReportingService,
    PaymentsReportingHelperService,
    PaymentsProgressHelperService,
    PaymentsHelperService,
    TransactionJobsCreationService,
    FspEnvVariableValidationService,
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
export class PaymentsModule implements OnModuleInit {
  private readonly logger = new Logger(PaymentsModule.name);

  constructor(
    private readonly fspEnvVariableValidationService: FspEnvVariableValidationService,
  ) {}

  onModuleInit() {
    const validationResult =
      this.fspEnvVariableValidationService.validateFspEnvVariableSettings({
        fspEnvVariableSettings: FSP_ENV_VARIABLE_SETTINGS,
      });

    const messagePrefix = 'FSP environment variable validation';
    if (validationResult.ok) {
      this.logger.log(
        `${messagePrefix} succeeded, ${validationResult.messages[0]}`,
      );
    } else {
      validationResult.messages.forEach((msg) => this.logger.error(msg));
      // We don't throw an HTTPException here because we want the application
      // to not start in case of a misconfiguration with environment variables.
      throw new Error(`${messagePrefix} failed, see previously logged errors.`);
    }
  }
}

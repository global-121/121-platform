import { Module } from '@nestjs/common';

import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { AirtelModule } from '@121-service/src/payments/fsp-integration/airtel/airtel.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProjectFspConfigurationsModule } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.module';
import { ProjectModule } from '@121-service/src/projects/projects.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationEventsModule } from '@121-service/src/registration-events/registration-events.module';
import { TransactionJobsProcessorAirtel } from '@121-service/src/transaction-jobs/processors/transaction-jobs-airtel.processor';
import { TransactionJobsProcessorIntersolveVisa } from '@121-service/src/transaction-jobs/processors/transaction-jobs-intersolve-visa.processor';
import { TransactionJobsProcessorNedbank } from '@121-service/src/transaction-jobs/processors/transaction-jobs-nedbank.processor';
import { TransactionJobsProcessorOnafriq } from '@121-service/src/transaction-jobs/processors/transaction-jobs-onafriq.processor';
import { TransactionJobsProcessorSafaricom } from '@121-service/src/transaction-jobs/processors/transaction-jobs-safaricom.processor';
import { TransactionJobsAirtelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-airtel.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsIntersolveVisaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-visa.service';
import { TransactionJobsNedbankService } from '@121-service/src/transaction-jobs/services/transaction-jobs-nedbank.service';
import { TransactionJobsOnafriqService } from '@121-service/src/transaction-jobs/services/transaction-jobs-onafriq.service';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    RedisModule,
    IntersolveVisaModule,
    SafaricomModule,
    AirtelModule,
    NedbankModule,
    ProjectFspConfigurationsModule,
    OnafriqModule,
    RegistrationsModule,
    ProjectModule,
    TransactionsModule,
    MessageQueuesModule,
    FspsModule,
    RegistrationEventsModule,
    MessageTemplateModule,
  ],
  providers: [
    TransactionJobsHelperService,
    TransactionJobsNedbankService,
    TransactionJobsSafaricomService,
    TransactionJobsAirtelService,
    TransactionJobsIntersolveVisaService,
    TransactionJobsOnafriqService,
    TransactionJobsProcessorIntersolveVisa,
    TransactionJobsProcessorSafaricom,
    TransactionJobsProcessorAirtel,
    TransactionJobsProcessorNedbank,
    TransactionJobsProcessorOnafriq,
    createScopedRepositoryProvider(OnafriqTransactionEntity),
  ],
})
export class TransactionJobsModule {}

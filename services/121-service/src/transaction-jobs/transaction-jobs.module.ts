import { Module } from '@nestjs/common';

import { EventsModule } from '@121-service/src/events/events.module';
import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { TransactionJobsProcessorIntersolveVisa } from '@121-service/src/transaction-jobs/processors/transaction-jobs-intersolve-visa.processor';
import { TransactionJobsProcessorNedbank } from '@121-service/src/transaction-jobs/processors/transaction-jobs-nedbank.processor';
import { TransactionJobsProcessorOnafriq } from '@121-service/src/transaction-jobs/processors/transaction-jobs-onafriq.processor';
import { TransactionJobsProcessorSafaricom } from '@121-service/src/transaction-jobs/processors/transaction-jobs-safaricom.processor';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsIntersolveVisaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-visa.service';
import { TransactionJobsNedbankService } from '@121-service/src/transaction-jobs/services/transaction-jobs-nedbank.service';
import { TransactionJobsOnafriqService } from '@121-service/src/transaction-jobs/services/transaction-jobs-onafriq.service';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';

@Module({
  imports: [
    RedisModule,
    IntersolveVisaModule,
    SafaricomModule,
    NedbankModule,
    ProgramFspConfigurationsModule,
    OnafriqModule,
    RegistrationsModule,
    ProgramModule,
    TransactionsModule,
    MessageQueuesModule,
    FspsModule,
    EventsModule,
    MessageTemplateModule,
  ],
  providers: [
    TransactionJobsHelperService,
    TransactionJobsNedbankService,
    TransactionJobsSafaricomService,
    TransactionJobsIntersolveVisaService,
    TransactionJobsOnafriqService,
    TransactionJobsProcessorIntersolveVisa,
    TransactionJobsProcessorSafaricom,
    TransactionJobsProcessorNedbank,
    TransactionJobsProcessorOnafriq,
  ],
})
export class TransactionJobsModule {}

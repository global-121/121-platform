import { Module } from '@nestjs/common';

import { EventsModule } from '@121-service/src/events/events.module';
import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { TransactionJobProcessorIntersolveVisa } from '@121-service/src/transaction-job-processors/processors/transaction-job-intersolve-visa.processor';
import { TransactionJobProcessorNedbank } from '@121-service/src/transaction-job-processors/processors/transaction-job-nedbank.processor';
import { TransactionJobProcessorSafaricom } from '@121-service/src/transaction-job-processors/processors/transaction-job-safaricom.processor';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';

@Module({
  imports: [
    RedisModule,
    IntersolveVisaModule,
    SafaricomModule,
    NedbankModule,
    ProgramFspConfigurationsModule,
    RegistrationsModule,
    ProgramModule,
    TransactionsModule,
    MessageQueuesModule,
    FspsModule,
    EventsModule,
    MessageTemplateModule,
  ],
  providers: [
    TransactionJobProcessorsService,
    TransactionJobProcessorIntersolveVisa,
    TransactionJobProcessorSafaricom,
    TransactionJobProcessorNedbank,
  ],
})
export class TransactionJobProcessorsModule {}

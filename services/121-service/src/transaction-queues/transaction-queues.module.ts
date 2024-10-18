// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionJobQueueNames } from '@121-service/src/shared/enum/transaction-job-queue-names.enum';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';

@Module({
  imports: [
    RedisModule,
    BullModule.registerQueue({
      name: TransactionJobQueueNames.intersolveVisa,
      processors: [
        {
          path: 'src/transaction-job-processors/processors/transaction-job-intersolve-visa.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: TransactionJobQueueNames.safaricom,
      processors: [
        {
          path: 'src/transaction-job-processors/processors/transaction-job-safaricom.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [TransactionQueuesService],
  exports: [TransactionQueuesService],
})
export class TransactionQueuesModule {}

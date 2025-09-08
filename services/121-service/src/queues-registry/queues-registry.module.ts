import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [
    // Transaction job queues
    BullModule.registerQueue({
      name: QueueNames.transactionJobsIntersolveVisa,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-intersolve-visa.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsNedbank,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-nedbank.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed -> 5 is a conservative limit, we can increase this later if needed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsSafaricom,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-safaricom.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsOnafriq,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-onafriq.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsAirtel,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-airtel.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsCommercialBankEthiopia,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-commercial-bank-ethiopia.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsIntersolveVoucher,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-intersolve-voucher.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed -> relatively low because of all the message traffic related to one transaction
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.transactionJobsExcel,
      processors: [
        {
          path: 'src/transaction-jobs/processors/transaction-jobs-excel.processor.ts',
        },
      ],
      limiter: {
        max: 1000, // Max number of jobs processed - processor just stores waiting transactions internally, so can be high
        duration: 1000, // per duration in milliseconds
      },
    }),

    // Safaricom Callback Queues
    BullModule.registerQueue({
      name: QueueNames.paymentCallbackSafaricomTransfer,
      processors: [
        {
          path: 'src/payments/reconciliation/safaricom-reconciliation/processors/safaricom-timeout-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.paymentCallbackSafaricomTimeout,
      processors: [
        {
          path: 'src/payments/reconciliation/safaricom-reconciliation/processors/safaricom-timeout-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    // Onafriq Callback Queue
    BullModule.registerQueue({
      name: QueueNames.paymentCallbackOnafriq,
      processors: [
        {
          path: 'src/payments/reconciliation/onafriq-reconciliation/processors/onafriq-transaction-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),

    // Message create Queues
    BullModule.registerQueue({
      name: QueueNames.createMessageReplyOnIncoming,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 2,
        },
      ],
      limiter: {
        max: 24, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.createMessageSmallBulk,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 4, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.createMessageMediumBulk,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 4, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.createMessageLargeBulk,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 4, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.createMessageLowPriority,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 2, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),

    // Message callback Queues
    BullModule.registerQueue({
      name: QueueNames.messageCallbackStatus,
      processors: [
        {
          path: 'src/notifications/processors/message-status-callback.processor.ts',
          concurrency: 4,
        },
      ],
      limiter: {
        max: 50, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNames.messageCallbackIncoming,
      processors: [
        {
          path: 'src/notifications/processors/message-incoming.processor.ts',
          concurrency: 4,
        },
      ],
      limiter: {
        max: 50, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),

    // Update registration Queues
    BullModule.registerQueue({
      name: QueueNames.registration,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 2,
        },
      ],
      limiter: {
        // 83.33 minutes for 100.000 PA
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [QueuesRegistryService, AzureLogService],
  exports: [QueuesRegistryService],
})
export class QueuesRegistryModule {}

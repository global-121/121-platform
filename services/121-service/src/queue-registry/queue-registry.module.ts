import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { SafaricomCallbackQueueNames } from '@121-service/src/payments/fsp-integration/safaricom/enum/safaricom-callback-queue-names.enum';
import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
  QueueNameRegistration,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { TransactionJobQueueNames } from '@121-service/src/shared/enum/transaction-job-queue-names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [
    // Transaction job queues
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
    BullModule.registerQueue({
      name: TransactionJobQueueNames.commercialBankEthiopia,
      processors: [
        {
          path: 'src/payments/fsp-integration/commercial-bank-ethiopia/processors/commercial-bank-ethiopia.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: TransactionJobQueueNames.intersolveVoucher,
      processors: [
        {
          path: 'src/payments/fsp-integration/intersolve-voucher/processors/intersolve-voucher.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),

    // Safaricom Callback Queues
    BullModule.registerQueue({
      name: SafaricomCallbackQueueNames.transfer,
      processors: [
        {
          path: 'src/financial-service-provider-callback-job-processors/processors/safaricom-transfer-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: SafaricomCallbackQueueNames.timeout,
      processors: [
        {
          path: 'src/financial-service-provider-callback-job-processors/processors/safaricom-timeout-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),

    // Message create Queues
    BullModule.registerQueue({
      name: QueueNameCreateMessage.replyOnIncoming,
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
      name: QueueNameCreateMessage.smallBulk,
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
      name: QueueNameCreateMessage.mediumBulk,
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
      name: QueueNameCreateMessage.largeBulk,
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
      name: QueueNameCreateMessage.lowPriority,
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
      name: QueueNameMessageCallBack.status,
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
      name: QueueNameMessageCallBack.incomingMessage,
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
      name: QueueNameRegistration.registration,
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
  providers: [QueueRegistryService, AzureLogService],
  exports: [QueueRegistryService],
})
export class QueueRegistryModule {}

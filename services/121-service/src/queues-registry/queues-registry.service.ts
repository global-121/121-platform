import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';

import { createRedisClient } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

function getEnumValues<T extends object>(e: T): string[] {
  return Object.values(e);
}

@Injectable()
export class QueuesRegistryService implements OnModuleInit {
  private allQueues: Queue[] = [];

  constructor(
    private azureLogService: AzureLogService,

    @InjectQueue(QueueNames.transactionJobsIntersolveVisa)
    public transactionJobIntersolveVisaQueue: Queue,
    @InjectQueue(QueueNames.transactionJobsIntersolveVoucher)
    public transactionJobIntersolveVoucherQueue: Queue,
    @InjectQueue(QueueNames.transactionJobsCommercialBankEthiopia)
    public transactionJobCommercialBankEthiopiaQueue: Queue,
    @InjectQueue(QueueNames.transactionJobsSafaricom)
    public transactionJobSafaricomQueue: Queue,
    @InjectQueue(QueueNames.transactionJobsNedbank)
    public transactionJobNedbankQueue: Queue,

    @InjectQueue(QueueNames.paymentCallbackSafaricomTransfer)
    public safaricomTransferCallbackQueue: Queue,
    @InjectQueue(QueueNames.paymentCallbackSafaricomTimeout)
    public safaricomTimeoutCallbackQueue: Queue,

    @InjectQueue(QueueNames.createMessageReplyOnIncoming)
    public createMessageReplyOnIncomingQueue: Queue,
    @InjectQueue(QueueNames.createMessageSmallBulk)
    public createMessageSmallBulkQueue: Queue,
    @InjectQueue(QueueNames.createMessageMediumBulk)
    public createMessageMediumBulkQueue: Queue,
    @InjectQueue(QueueNames.createMessageLargeBulk)
    public createMessageLargeBulkQueue: Queue,
    @InjectQueue(QueueNames.createMessageLowPriority)
    public createMessageLowPriorityQueue: Queue,

    @InjectQueue(QueueNames.messageCallbackIncoming)
    public messageIncomingCallbackQueue: Queue,
    @InjectQueue(QueueNames.messageCallbackStatus)
    public messageStatusCallbackQueue: Queue,

    @InjectQueue(QueueNames.registration)
    public updateRegistrationQueue: Queue,
  ) {
    for (const queueName of Object.values(QueueNames)) {
      const propertyKey = this.getPropertyKeyForQueueName(queueName);
      const queue = (this as Record<string, Queue>)[propertyKey];
      if (queue) {
        this.allQueues.push(queue);
        this.queueNameToQueueMap[queueName] = queue;
      }
    }
    this.allQueues = [
      this.transactionJobIntersolveVisaQueue,
      this.transactionJobIntersolveVoucherQueue,
      this.transactionJobCommercialBankEthiopiaQueue,
      this.transactionJobSafaricomQueue,
      this.transactionJobNedbankQueue,
      this.safaricomTimeoutCallbackQueue,
      this.safaricomTransferCallbackQueue,
      this.createMessageReplyOnIncomingQueue,
      this.createMessageSmallBulkQueue,
      this.createMessageMediumBulkQueue,
      this.createMessageLargeBulkQueue,
      this.createMessageLowPriorityQueue,
      this.messageIncomingCallbackQueue,
      this.messageStatusCallbackQueue,
      this.updateRegistrationQueue,
    ];
    this.assertAllQueuesPresent();
  }

  private getPropertyKeyForQueueName(queueName: string): string {
    const mapping: Record<string, string> = {
      [QueueNames.transactionJobsIntersolveVisa]:
        'transactionJobIntersolveVisaQueue',
      [QueueNames.transactionJobsIntersolveVoucher]:
        'transactionJobIntersolveVoucherQueue',
      [QueueNames.transactionJobsCommercialBankEthiopia]:
        'transactionJobCommercialBankEthiopiaQueue',
      [QueueNames.transactionJobsSafaricom]: 'transactionJobSafaricomQueue',
      [QueueNames.transactionJobsNedbank]: 'transactionJobNedbankQueue',
      [QueueNames.paymentCallbackSafaricomTransfer]:
        'safaricomTransferCallbackQueue',
      [QueueNames.paymentCallbackSafaricomTimeout]:
        'safaricomTimeoutCallbackQueue',
      [QueueNames.createMessageReplyOnIncoming]:
        'createMessageReplyOnIncomingQueue',
      [QueueNames.createMessageSmallBulk]: 'createMessageSmallBulkQueue',
      [QueueNames.createMessageMediumBulk]: 'createMessageMediumBulkQueue',
      [QueueNames.createMessageLargeBulk]: 'createMessageLargeBulkQueue',
      [QueueNames.createMessageLowPriority]: 'createMessageLowPriorityQueue',
      [QueueNames.messageCallbackIncoming]: 'messageIncomingCallbackQueue',
      [QueueNames.messageCallbackStatus]: 'messageStatusCallbackQueue',
      [QueueNames.registration]: 'updateRegistrationQueue',
    };
    return mapping[queueName];
  }

  private assertAllQueuesPresent() {
    const expectedNames = [...getEnumValues(QueueNames)];
    const actualNames = this.allQueues.map((q) => q.name);
    const missing = expectedNames.filter((name) => !actualNames.includes(name));
    if (missing.length > 0) {
      throw new Error(`Missing queues for: ${missing.join(', ')}`);
    }
  }

  async onModuleInit(): Promise<void> {
    // This is needed because of the issue where on 121-service startup jobs will start processing before the process handlers are registered, which leads to failed jobs.
    // We are not able to prevent this from happening, so instead this workaround will retry all failed jobs on startup. By then the process handler is up and the jobs will not fail for this reason again.
    // Wait 5 seconds to be sure that the process handlers are registered
    this.scheduleRetryFailedJobs().catch((err) => {
      // We just put this error here to make ts happy. The error is already logged in the function
      console.error('scheduleRetryFailedJobs', err);
    });
  }

  private async scheduleRetryFailedJobs(): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await this.retryFailedJobs();
    } catch (err) {
      console.error('Error in scheduleRetryFailedJobs: ', err);
      this.azureLogService.logError(err, true);
    }
  }

  private async retryFailedJobs(): Promise<void> {
    for (const queue of this.allQueues) {
      const failedJobs = await queue.getFailed();
      // Only retry for this specific error message, as we know the job processing has never started and is therefore safe to retry (jobs are not idempotent)
      const missingProcessHandlerJobs = failedJobs.filter((job) =>
        job.failedReason?.includes('Missing process handler for job type'),
      );
      if (!missingProcessHandlerJobs.length) {
        continue;
      }
      console.log(
        `Found ${failedJobs.length} failed jobs because of missing process handler for queue ${queue.name}. Retrying now.`,
      );
      for (const job of missingProcessHandlerJobs) {
        await job.retry();
      }
    }
  }

  async emptyAllQueues(): Promise<void> {
    // Bull queues involve complex data structures and Bull maintains various metadata for job management.
    // Therefore the data of the Bull queue and the ioredis queue are deleted seperately
    for (const queue of this.allQueues) {
      await queue.empty();
    }
    const redisClient = createRedisClient();
    // Prefix is needed here because .keys does not take into account the prefix of the redis client
    const keys = await redisClient.keys(`${process.env.REDIS_PREFIX}:*`);
    if (keys.length) {
      const keysWithoutPrefix = keys.map((key) =>
        key.replace(process.env.REDIS_PREFIX + ':', ''),
      );
      await this.batchDeleteKeys(redisClient, keysWithoutPrefix);
    }
    await redisClient.keys(`${process.env.REDIS_PREFIX}:*`);
  }

  // This is prevent this error when deleting large amount of keys: RangeError: Maximum call stack size exceeded
  private async batchDeleteKeys(
    redisClient: Redis,
    keys: string[],
    batchSize = 1000,
  ): Promise<void> {
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await redisClient.del(...batch);
    }
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';

import { createRedisClient } from '@121-service/src/payments/redis/redis-client';
import { CreateMessageQueueNames } from '@121-service/src/queues-registry/enum/create-message-queue-names.enum';
import { MessageCallBackQueueNames } from '@121-service/src/queues-registry/enum/message-callback-queue-names.enum';
import { RegistrationQueueNames } from '@121-service/src/queues-registry/enum/registration-queue-names.enum';
import { SafaricomCallbackQueueNames } from '@121-service/src/queues-registry/enum/safaricom-callback-queue-names.enum';
import { TransactionJobQueueNames } from '@121-service/src/queues-registry/enum/transaction-job-queue-names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class QueuesRegistryService implements OnModuleInit {
  private allQueues: Queue[] = [];

  constructor(
    private azureLogService: AzureLogService,

    @InjectQueue(TransactionJobQueueNames.intersolveVisa)
    public transactionJobIntersolveVisaQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.intersolveVoucher)
    public transactionJobIntersolveVoucherQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.commercialBankEthiopia)
    public transactionJobCommercialBankEthiopiaQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.safaricom)
    public transactionJobSafaricomQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.nedbank)
    public transactionJobNedbankQueue: Queue,

    @InjectQueue(SafaricomCallbackQueueNames.transfer)
    public safaricomTransferCallbackQueue: Queue,
    @InjectQueue(SafaricomCallbackQueueNames.timeout)
    public safaricomTimeoutCallbackQueue: Queue,

    @InjectQueue(CreateMessageQueueNames.replyOnIncoming)
    public createMessageReplyOnIncomingQueue: Queue,
    @InjectQueue(CreateMessageQueueNames.smallBulk)
    public createMessageSmallBulkQueue: Queue,
    @InjectQueue(CreateMessageQueueNames.mediumBulk)
    public createMessageMediumBulkQueue: Queue,
    @InjectQueue(CreateMessageQueueNames.largeBulk)
    public createMessageLargeBulkQueue: Queue,
    @InjectQueue(CreateMessageQueueNames.lowPriority)
    public createMessageLowPriorityQueue: Queue,

    @InjectQueue(MessageCallBackQueueNames.incomingMessage)
    public messageIncomingCallbackQueue: Queue,
    @InjectQueue(MessageCallBackQueueNames.status)
    public messageStatusCallbackQueue: Queue,

    @InjectQueue(RegistrationQueueNames.registration)
    public updateRegistrationQueue: Queue,
  ) {
    this.allQueues = [
      this.transactionJobIntersolveVisaQueue,
      this.transactionJobIntersolveVoucherQueue,
      this.transactionJobCommercialBankEthiopiaQueue,
      this.transactionJobSafaricomQueue,
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

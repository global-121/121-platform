import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';

import { env } from '@121-service/src/env';
import { createRedisClient } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { REGISTERED_PROCESSORS } from '@121-service/src/queues-registry/register-processor.decorator';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class QueuesRegistryService implements OnModuleInit {
  private allQueues: Record<QueueNames, Queue>;

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

    @InjectQueue(QueueNames.transactionJobsAirtel)
    public transactionJobAirtelQueue: Queue,

    @InjectQueue(QueueNames.transactionJobsCooperativeBankOfOromia)
    public transactionJobCooperativeBankOfOromiaQueue: Queue,

    @InjectQueue(QueueNames.transactionJobsOnafriq)
    public transactionJobOnafriqQueue: Queue,

    @InjectQueue(QueueNames.transactionJobsExcel)
    public transactionJobExcelQueue: Queue,

    @InjectQueue(QueueNames.paymentCallbackSafaricomTransfer)
    public safaricomTransferCallbackQueue: Queue,

    @InjectQueue(QueueNames.paymentCallbackSafaricomTimeout)
    public safaricomTimeoutCallbackQueue: Queue,

    @InjectQueue(QueueNames.paymentCallbackOnafriq)
    public onafriqCallbackQueue: Queue,

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
    this.allQueues = {
      [QueueNames.transactionJobsIntersolveVisa]:
        this.transactionJobIntersolveVisaQueue,
      [QueueNames.transactionJobsIntersolveVoucher]:
        this.transactionJobIntersolveVoucherQueue,
      [QueueNames.transactionJobsCommercialBankEthiopia]:
        this.transactionJobCommercialBankEthiopiaQueue,
      [QueueNames.transactionJobsSafaricom]: this.transactionJobSafaricomQueue,
      [QueueNames.transactionJobsNedbank]: this.transactionJobNedbankQueue,
      [QueueNames.transactionJobsAirtel]: this.transactionJobAirtelQueue,
      [QueueNames.transactionJobsCooperativeBankOfOromia]:
        this.transactionJobCooperativeBankOfOromiaQueue,
      [QueueNames.transactionJobsOnafriq]: this.transactionJobOnafriqQueue,
      [QueueNames.transactionJobsExcel]: this.transactionJobExcelQueue,
      [QueueNames.paymentCallbackSafaricomTransfer]:
        this.safaricomTransferCallbackQueue,
      [QueueNames.paymentCallbackSafaricomTimeout]:
        this.safaricomTimeoutCallbackQueue,
      [QueueNames.paymentCallbackOnafriq]: this.onafriqCallbackQueue,
      [QueueNames.createMessageReplyOnIncoming]:
        this.createMessageReplyOnIncomingQueue,
      [QueueNames.createMessageSmallBulk]: this.createMessageSmallBulkQueue,
      [QueueNames.createMessageMediumBulk]: this.createMessageMediumBulkQueue,
      [QueueNames.createMessageLargeBulk]: this.createMessageLargeBulkQueue,
      [QueueNames.createMessageLowPriority]: this.createMessageLowPriorityQueue,
      [QueueNames.messageCallbackIncoming]: this.messageIncomingCallbackQueue,
      [QueueNames.messageCallbackStatus]: this.messageStatusCallbackQueue,
      [QueueNames.registration]: this.updateRegistrationQueue,
    };
  }

  async onModuleInit(): Promise<void> {
    const registered = Array.from(REGISTERED_PROCESSORS);
    const expected = Object.keys(this.allQueues);
    const missing = expected.filter((q) => !registered.includes(q));
    if (missing.length > 0) {
      throw new Error(
        `Missing processor registrations for: ${missing.join(', ')}`,
      );
    }
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
    for (const queue of Object.values(this.allQueues)) {
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
    // Therefore the data of the Bull queue and the ioredis queue are deleted separately
    for (const queue of Object.values(this.allQueues)) {
      await queue.empty();
    }
    const redisClient = createRedisClient();
    // Prefix is needed here because .keys does not take into account the prefix of the redis client
    const keys = await redisClient.keys(`${env.REDIS_PREFIX}:*`);
    if (keys.length) {
      const keysWithoutPrefix = keys.map((key) =>
        key.replace(env.REDIS_PREFIX + ':', ''),
      );
      await this.batchDeleteKeys(redisClient, keysWithoutPrefix);
    }
    await redisClient.keys(`${env.REDIS_PREFIX}:*`);
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

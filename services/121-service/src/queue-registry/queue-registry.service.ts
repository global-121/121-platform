import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { SafaricomCallbackQueueNames } from '@121-service/src/payments/fsp-integration/safaricom/enum/safaricom-callback-queue-names.enum';
import { createRedisClient } from '@121-service/src/payments/redis/redis-client';
import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
  QueueNameRegistration,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { TransactionJobQueueNames } from '@121-service/src/shared/enum/transaction-job-queue-names.enum';

@Injectable()
export class QueueRegistryService {
  private allQueues: Queue[] = [];

  constructor(
    @InjectQueue(TransactionJobQueueNames.intersolveVisa)
    public transactionJobIntersolveVisaQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.intersolveVoucher)
    public transactionJobIntersolveVoucherQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.commercialBankEthiopia)
    public transactionJobCommercialBankEthiopiaQueue: Queue,
    @InjectQueue(TransactionJobQueueNames.safaricom)
    public transactionJobSafaricomQueue: Queue,

    @InjectQueue(SafaricomCallbackQueueNames.transfer)
    public safaricomTransferCallbackQueue: Queue,
    @InjectQueue(SafaricomCallbackQueueNames.timeout)
    public safaricomTimeoutCallbackQueue: Queue,

    @InjectQueue(QueueNameCreateMessage.replyOnIncoming)
    public createMessageReplyOnIncomingQueue: Queue,
    @InjectQueue(QueueNameCreateMessage.smallBulk)
    public createMessageSmallBulkQueue: Queue,
    @InjectQueue(QueueNameCreateMessage.mediumBulk)
    public createMessageMediumBulkQueue: Queue,
    @InjectQueue(QueueNameCreateMessage.largeBulk)
    public createMessageLargeBulkQueue: Queue,
    @InjectQueue(QueueNameCreateMessage.lowPriority)
    public createMessageLowPriorityQueue: Queue,

    @InjectQueue(QueueNameMessageCallBack.incomingMessage)
    public messageIncomingCallbackQueue: Queue,
    @InjectQueue(QueueNameMessageCallBack.status)
    public messageStatusCallbackQueue: Queue,

    @InjectQueue(QueueNameRegistration.registration)
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

  public async retryFailedJobs(): Promise<void> {
    for (const queue of this.allQueues) {
      const failedJobs = await queue.getFailed();
      for (const job of failedJobs) {
        // Only retry for this specific error message, as we know the job processing has never started and is therefore safe to retry (jobs are not idempotent)
        if (
          job.failedReason?.includes('Missing process handler for job type')
        ) {
          await job.retry();
        }
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
      await redisClient.del(...keysWithoutPrefix);
    }

    await redisClient.keys(`${process.env.REDIS_PREFIX}:*`);
  }
}

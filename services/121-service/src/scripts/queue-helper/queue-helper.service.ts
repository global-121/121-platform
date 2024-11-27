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
export class QueueHelperService {
  private allQueues: Queue[] = [];

  constructor(
    @InjectQueue(TransactionJobQueueNames.intersolveVisa)
    private paymentIntersolveVisa: Queue,
    @InjectQueue(TransactionJobQueueNames.intersolveVoucher)
    private paymentIntersolveVoucher: Queue,
    @InjectQueue(TransactionJobQueueNames.commercialBankEthiopia)
    private paymentCommercialBankEthiopia: Queue,
    @InjectQueue(TransactionJobQueueNames.safaricom)
    private paymentSafaricom: Queue,
    @InjectQueue(QueueNameCreateMessage.replyOnIncoming)
    private replyOnIncoming: Queue,
    @InjectQueue(QueueNameCreateMessage.smallBulk) private smallBulk: Queue,
    @InjectQueue(QueueNameCreateMessage.mediumBulk) private mediumBulk: Queue,
    @InjectQueue(QueueNameCreateMessage.largeBulk) private largeBulk: Queue,
    @InjectQueue(QueueNameCreateMessage.lowPriority) private lowPriority: Queue,
    @InjectQueue(QueueNameMessageCallBack.incomingMessage)
    private incomingMessage: Queue,
    @InjectQueue(QueueNameMessageCallBack.status)
    private statusMessage: Queue,
    @InjectQueue(QueueNameRegistration.registration)
    private queueRegistrationUpdate: Queue,
    @InjectQueue(SafaricomCallbackQueueNames.transfer)
    private safaricomTransferCallbackQueue: Queue,
    @InjectQueue(SafaricomCallbackQueueNames.timeout)
    private safaricomTimeoutCallbackQueue: Queue,
  ) {
    this.allQueues = [
      this.paymentIntersolveVisa,
      this.paymentIntersolveVoucher,
      this.paymentCommercialBankEthiopia,
      this.paymentSafaricom,
      this.replyOnIncoming,
      this.smallBulk,
      this.mediumBulk,
      this.largeBulk,
      this.lowPriority,
      this.incomingMessage,
      this.statusMessage,
      this.queueRegistrationUpdate,
      this.safaricomTimeoutCallbackQueue,
      this.safaricomTransferCallbackQueue,
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

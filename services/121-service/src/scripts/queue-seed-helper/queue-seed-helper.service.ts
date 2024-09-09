import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { createRedisClient } from '@121-service/src/payments/redis/redis-client';
import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { TransactionQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';

@Injectable()
export class QueueSeedHelperService {
  constructor(
    @InjectQueue(TransactionQueueNames.paymentIntersolveVisa)
    private paymentIntersolveVisa: Queue,
    @InjectQueue(TransactionQueueNames.paymentIntersolveVoucher)
    private paymentIntersolveVoucher: Queue,
    @InjectQueue(TransactionQueueNames.paymentCommercialBankEthiopia)
    private paymentCommercialBankEthiopia: Queue,
    @InjectQueue(TransactionQueueNames.paymentSafaricom)
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
  ) {}

  async emptyAllQueues(): Promise<void> {
    // Bull queues involve complex data structures and Bull maintains various metadata for job management.
    // Therefore the data of the Bull queue and the ioredis queue are deleted seperately
    const bullQueues = [
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
    ];

    for (const queue of bullQueues) {
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

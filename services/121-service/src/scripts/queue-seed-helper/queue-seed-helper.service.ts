import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
} from '@121-service/src/notifications/enum/queue.names.enum';
import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { createRedisClient } from '@121-service/src/payments/redis-client';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class QueueSeedHelperService {
  constructor(
    @InjectQueue(QueueNamePayment.paymentIntersolveVisa)
    private paymentIntersolveVisa: Queue,
    @InjectQueue(QueueNamePayment.paymentIntersolveVoucher)
    private paymentIntersolveVoucher: Queue,
    @InjectQueue(QueueNamePayment.paymentCommercialBankEthiopia)
    private paymentCommercialBankEthiopia: Queue,
    @InjectQueue(QueueNamePayment.paymentSafaricom)
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

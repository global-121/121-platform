import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';
import { TransactionQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';

@Injectable()
export class TransactionQueuesService {
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(TransactionQueueNames.paymentIntersolveVisa)
    private readonly paymentIntersolveVisaQueue: Queue,
    @InjectQueue(TransactionQueueNames.paymentSafaricom)
    private readonly paymentSafaricomQueue: Queue,
  ) {}

  public async addIntersolveVisaTransactionJobs(
    transferJobs: IntersolveVisaTransactionJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job = await this.paymentIntersolveVisaQueue.add(
        PaymentQueueNames.sendPayment,
        transferJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addSafaricomTransactionJobs(
    safaricomTransactionJobs: SafaricomTransactionJobDto[],
  ): Promise<void> {
    for (const safaricomTransactionJob of safaricomTransactionJobs) {
      const job = await this.paymentSafaricomQueue.add(
        PaymentQueueNames.sendPayment,
        safaricomTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }
}

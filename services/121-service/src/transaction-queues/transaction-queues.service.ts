import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/shared/enum/queue-process.names.enum';
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
    @InjectQueue(QueueNamePayment.paymentIntersolveVisa)
    private readonly paymentIntersolveVisaQueue: Queue,
    @InjectQueue(QueueNamePayment.paymentSafaricom)
    private readonly paymentSafaricomQueue: Queue,
  ) {}

  public async addIntersolveVisaTransactionJobs(
    transferJobs: IntersolveVisaTransactionJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job = await this.paymentIntersolveVisaQueue.add(
        ProcessNamePayment.sendPayment,
        transferJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addSafaricomTransactionJobs(
    transferJobs: SafaricomTransactionJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job = await this.paymentSafaricomQueue.add(
        ProcessNamePayment.sendPayment,
        transferJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }
}

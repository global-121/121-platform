import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { TransactionJobQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';

@Processor(TransactionJobQueueNames.safaricom)
export class TransactionJobProcessorSafaricom {
  constructor(
    private readonly transactionJobProcessorsService: TransactionJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSafaricomTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobProcessorsService.processSafaricomTransactionJob(
        job.data,
      );
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

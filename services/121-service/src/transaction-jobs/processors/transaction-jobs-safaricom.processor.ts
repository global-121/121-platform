import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionJobQueueNames } from '@121-service/src/queues-registry/enum/transaction-job-queue-names.enum';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';

@Processor(TransactionJobQueueNames.safaricom)
export class TransactionJobsProcessorSafaricom {
  constructor(
    private readonly transactionJobsSafaricomService: TransactionJobsSafaricomService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSafaricomTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobsSafaricomService.processSafaricomTransactionJob(
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

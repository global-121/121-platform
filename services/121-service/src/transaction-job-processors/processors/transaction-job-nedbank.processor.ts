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
import { TransactionJobProcessorsNedbankService } from '@121-service/src/transaction-job-processors/services/transaction-job-processors-nedbank.service';

@Processor(TransactionJobQueueNames.nedbank)
export class TransactionJobProcessorNedbank {
  constructor(
    private readonly TransactionJobProcessorsNedbankService: TransactionJobProcessorsNedbankService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleNedbankTransactionJob(job: Job): Promise<void> {
    try {
      await this.TransactionJobProcessorsNedbankService.processNedbankTransactionJob(
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

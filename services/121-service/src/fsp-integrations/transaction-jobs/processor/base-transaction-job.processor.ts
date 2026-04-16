import { Process } from '@nestjs/bull';
import { Job } from 'bull';
import Redis from 'ioredis';

import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/transaction-job-service.interface';
import {
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

export abstract class BaseTransactionJobProcessor {
  constructor(
    protected readonly transactionJobService: TransactionJobService,
    protected readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobService.processTransactionJob(job.data);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

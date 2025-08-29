import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { TransactionJobsNedbankService } from '@121-service/src/transaction-jobs/services/transaction-jobs-nedbank.service';

@RegisteredProcessor(QueueNames.transactionJobsNedbank)
export class TransactionJobsProcessorNedbank {
  constructor(
    private readonly transactionJobsNedbankService: TransactionJobsNedbankService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleNedbankTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobsNedbankService.processNedbankTransactionJob(
        job.data,
      );
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.projectId), job.id);
    }
  }
}

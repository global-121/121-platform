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
import { TransactionJobsAirtelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-airtel.service';

@RegisteredProcessor(QueueNames.transactionJobsAirtel)
export class TransactionJobsProcessorAirtel {
  constructor(
    private readonly transactionJobsAirtelService: TransactionJobsAirtelService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleAirtelTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobsAirtelService.processAirtelTransactionJob(
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

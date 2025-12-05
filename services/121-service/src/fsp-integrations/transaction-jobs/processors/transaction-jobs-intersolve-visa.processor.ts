import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { TransactionJobsIntersolveVisaService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-intersolve-visa.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.transactionJobsIntersolveVisa)
export class TransactionJobsProcessorIntersolveVisa {
  constructor(
    private readonly transactionJobsIntersolveVisaService: TransactionJobsIntersolveVisaService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleIntersolveVisaTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobsIntersolveVisaService.processIntersolveVisaTransactionJob(
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

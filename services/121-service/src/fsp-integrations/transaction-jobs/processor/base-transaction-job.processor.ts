import { Process } from '@nestjs/bull';
import { Job } from 'bull';
import Redis from 'ioredis';

import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/transaction-job-service.interface';
import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';
import { getRedisSetName } from '@121-service/src/payments/redis/redis-client';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

export abstract class BaseTransactionJobProcessor<
  T extends SharedTransactionJobDto,
> {
  constructor(
    protected readonly transactionJobService: TransactionJobService<T>,
    protected readonly redisClient: Redis,
  ) {}

  @Process({ name: JobNames.default, concurrency: 2 })
  async handleTransactionJob(job: Job<T>): Promise<void> {
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

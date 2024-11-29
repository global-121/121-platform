import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';

@Injectable()
export class TransactionQueuesService {
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly queueRegistryService: QueueRegistryService,
  ) {}

  public async addIntersolveVisaTransactionJobs(
    transferJobs: IntersolveVisaTransactionJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job =
        await this.queueRegistryService.transactionJobIntersolveVisaQueue.add(
          JobNames.default,
          transferJob,
        );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addSafaricomTransactionJobs(
    safaricomTransactionJobs: SafaricomTransactionJobDto[],
  ): Promise<void> {
    for (const safaricomTransactionJob of safaricomTransactionJobs) {
      const job =
        await this.queueRegistryService.transactionJobSafaricomQueue.add(
          JobNames.default,
          safaricomTransactionJob,
        );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }
}

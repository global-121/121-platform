import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { TransactionJobsIntersolveVoucherService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-intersolve-voucher.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.transactionJobsIntersolveVoucher)
export class TransactionJobsProcessorIntersolveVoucher {
  constructor(
    private readonly transactionJobsIntersolveVoucherService: TransactionJobsIntersolveVoucherService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleIntersolveVoucherTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobsIntersolveVoucherService.processIntersolveVoucherTransactionJob(
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

import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { SafaricomReconciliationService } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { SafaricomCallbackQueueNames } from '@121-service/src/queues-registry/enum/safaricom-callback-queue-names.enum';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Processor(SafaricomCallbackQueueNames.transfer)
export class TransferCallbackJobProcessorSafaricom {
  constructor(
    private readonly safaricomReconciliationService: SafaricomReconciliationService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSafaricomTransferCallbackJob(job: Job): Promise<void> {
    try {
      await this.safaricomReconciliationService.processSafaricomTransferCallbackJob(
        job.data,
      );
    } catch (error) {
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

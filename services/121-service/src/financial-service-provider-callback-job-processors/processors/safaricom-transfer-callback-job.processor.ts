import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { FinancialServiceProviderCallbackJobProcessorsService } from '@121-service/src/financial-service-provider-callback-job-processors/financial-service-provider-callback-job-processors.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNamesSafaricomCallback } from '@121-service/src/queues-registry/enum/queue-names-safaricom-callback.enum';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Processor(QueueNamesSafaricomCallback.transfer)
export class TransferCallbackJobProcessorSafaricom {
  constructor(
    private readonly financialServiceProviderCallbackJobProcessorsService: FinancialServiceProviderCallbackJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSafaricomTransferCallbackJob(job: Job): Promise<void> {
    try {
      await this.financialServiceProviderCallbackJobProcessorsService.processSafaricomTransferCallbackJob(
        job.data,
      );
    } catch (error) {
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

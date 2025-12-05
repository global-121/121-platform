import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { SafaricomReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/safaricom-reconciliation/safaricom-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.paymentCallbackSafaricomTimeout)
export class TimeoutCallbackJobProcessorSafaricom {
  constructor(
    private readonly safaricomReconciliationService: SafaricomReconciliationService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSafaricomTimeoutCallbackJob(job: Job): Promise<void> {
    try {
      await this.safaricomReconciliationService.processSafaricomTimeoutCallbackJob(
        job.data,
      );
    } catch (error) {
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

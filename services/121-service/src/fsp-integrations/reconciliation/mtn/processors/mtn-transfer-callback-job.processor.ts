import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.paymentCallbackMtnTransfer)
export class TransferCallbackJobProcessorMtn {
  constructor(
    private readonly mtnReconciliationService: MtnReconciliationService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleMtnTransferCallbackJob(job: Job): Promise<void> {
    try {
      await this.mtnReconciliationService.processMtnTransferCallbackJob(
        job.data,
      );
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

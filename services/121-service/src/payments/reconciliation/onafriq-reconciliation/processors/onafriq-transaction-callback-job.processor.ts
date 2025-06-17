import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentCallbackQueueNames } from '@121-service/src/queues-registry/enum/payment-callback-queue-names.enum';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Processor(PaymentCallbackQueueNames.onafriqTransaction)
export class TransactionCallbackJobProcessorOnafriq {
  constructor(
    private readonly onafriqReconciliationService: OnafriqReconciliationService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleOnafriqTransferCallbackJob(job: Job): Promise<void> {
    try {
      await this.onafriqReconciliationService.processOnafriqTransactionCallbackJob(
        job.data,
      );
    } catch (error) {
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

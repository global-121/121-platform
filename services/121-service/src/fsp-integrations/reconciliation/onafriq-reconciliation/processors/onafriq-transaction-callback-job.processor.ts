import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { OnafriqReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.paymentCallbackOnafriq)
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

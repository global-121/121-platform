import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Processor(QueueNames.transactionJobsCommercialBankEthiopia)
export class PaymentProcessorCommercialBankEthiopia {
  constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSendPayment(job: Job): Promise<void> {
    await this.commercialBankEthiopiaService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}

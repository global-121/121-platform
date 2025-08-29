import { Process } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.transactionJobsIntersolveVoucher)
export class PaymentProcessorIntersolveVoucher {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVoucherService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.projectId), job.id);
  }
}

import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

@Processor(QueueNamePayment.paymentIntersolveVisa)
export class PaymentProcessorIntersolveVisa {
  constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNamePayment.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    // TODO: Fix this, according to re-implemented and refactored code.
    //await this.intersolveVisaService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}

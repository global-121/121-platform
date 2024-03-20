import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '../../../enum/queue.names.enum';
import { getRedisSetName, REDIS_CLIENT } from '../../../redis-client';
import { IntersolveVisaService } from '../intersolve-visa.service';

@Processor(QueueNamePayment.paymentIntersolveVisa)
export class PaymentProcessorIntersolveVisa {
  constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNamePayment.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVisaService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}

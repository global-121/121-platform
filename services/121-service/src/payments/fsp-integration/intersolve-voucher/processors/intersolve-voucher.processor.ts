import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';
import { ProcessName, QueueNamePayment } from '../../../enum/queue.names.enum';
import { getRedisSetName, REDIS_CLIENT } from '../../../redis-client';
import { IntersolveVoucherService } from '../intersolve-voucher.service';

@Processor(QueueNamePayment.paymentIntersolveVoucher)
export class PaymentProcessorIntersolveVoucher {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}
  @Process(ProcessName.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVoucherService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}

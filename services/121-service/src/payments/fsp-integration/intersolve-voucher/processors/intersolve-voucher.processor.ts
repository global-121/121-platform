import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

@Processor(QueueNamePayment.paymentIntersolveVoucher)
export class PaymentProcessorIntersolveVoucher {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}
  @Process(ProcessNamePayment.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVoucherService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}

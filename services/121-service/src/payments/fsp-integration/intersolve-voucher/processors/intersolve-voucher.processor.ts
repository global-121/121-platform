import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';
import { TransactionQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';

@Processor(TransactionQueueNames.paymentIntersolveVoucher)
export class PaymentProcessorIntersolveVoucher {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}
  @Process(PaymentQueueNames.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVoucherService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}

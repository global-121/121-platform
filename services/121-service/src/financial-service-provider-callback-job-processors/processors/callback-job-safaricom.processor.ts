import { FinancialServiceProviderCallbackJobProcessorsService } from '@121-service/src/financial-service-provider-callback-job-processors/financial-service-provider-callback-job-processors.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import {
  ProcessNamePayment,
  QueueNamePaymentCallBack,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

@Processor(QueueNamePaymentCallBack.safaricom)
export class CallbackJobProcessorSafaricom {
  constructor(
    private readonly financialServiceProviderCallbackJobProcessorsService: FinancialServiceProviderCallbackJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNamePayment.callbackPayment)
  async handleSafaricomCallbackJob(job: Job): Promise<void> {
    try {
      await this.financialServiceProviderCallbackJobProcessorsService.processSafaricomCallbackJob(
        job.data,
      );
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}

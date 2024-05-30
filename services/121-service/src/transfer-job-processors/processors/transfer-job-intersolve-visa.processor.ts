import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis-client';
import { TransferJobProcessorsService } from '@121-service/src/transfer-job-processors/transfer-job-processors.service';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

// TODO: REFACTOR: Rename QueueNamePayment to transferQueueNames or something, and move the enum to the TransferQueues Module. Also rename the paymentIntersolveVisa to IntersolveVisa probably.
@Processor(QueueNamePayment.paymentIntersolveVisa)
export class TransferJobProcessorIntersolveVisa {
  constructor(
    private readonly transferJobProcessorsService: TransferJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNamePayment.sendPayment)
  async handleIntersolveVisaTransferJob(job: Job): Promise<void> {
    try {
      await this.transferJobProcessorsService.processIntersolveVisaTransferJob(
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

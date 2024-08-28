import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

// TODO: REFACTOR: Rename QueueNamePayment to transferQueueNames or something, and move the enum to the TransferQueues Module. Also rename the paymentIntersolveVisa to IntersolveVisa probably.
@Processor(QueueNamePayment.paymentSafaricom)
export class TransactionJobProcessorSafaricom {
  constructor(
    private readonly transactionJobProcessorsService: TransactionJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNamePayment.sendPayment)
  async handleSafaricomTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobProcessorsService.processSafaricomTransactionJob(
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

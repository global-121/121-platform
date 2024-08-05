import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

// TODO: REFACTOR: Rename QueueNamePayment to transferQueueNames or something, and move the enum to the TransferQueues Module. Also rename the paymentIntersolveVisa to IntersolveVisa probably.
@Processor(QueueNamePayment.paymentIntersolveVisa)
export class TransactionJobProcessorIntersolveVisa {
  constructor(
    private readonly transactionJobProcessorsService: TransactionJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNamePayment.sendPayment)
  async handleIntersolveVisaTransactionJob(job: Job): Promise<void> {
    try {
      await this.transactionJobProcessorsService.processIntersolveVisaTransactionJob(
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

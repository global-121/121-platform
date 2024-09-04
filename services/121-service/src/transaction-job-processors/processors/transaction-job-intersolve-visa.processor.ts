import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';
import { TransactionQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

// TODO: REFACTOR: Rename TransactionQueueNames to transferQueueNames or something, and move the enum to the TransferQueues Module. Also rename the paymentIntersolveVisa to IntersolveVisa probably.
@Processor(TransactionQueueNames.paymentIntersolveVisa)
export class TransactionJobProcessorIntersolveVisa {
  constructor(
    private readonly transactionJobProcessorsService: TransactionJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(PaymentQueueNames.sendPayment)
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

import {
  ProcessNameStoreTransaction,
  QueueNameStoreTransaction,
} from '@121-service/src/payments/enum/queue.names.enum';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';
import { StoreTransactionJobProcessorsService } from '@121-service/src/store-transaction-job-processors/store-transaction-job-processors.service';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

@Processor(QueueNameStoreTransaction.storeTransactionIntersolveVisa)
export class StoreTransactionJobProcessorIntersolveVisa {
  constructor(
    private readonly storeTransactionJobProcessorsService: StoreTransactionJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(ProcessNameStoreTransaction.storeTransaction)
  async handleIntersolveVisaStoreTransactionJob(job: Job): Promise<void> {
    try {
      await this.storeTransactionJobProcessorsService.processIntersolveVisaStoreTransactionJob(
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

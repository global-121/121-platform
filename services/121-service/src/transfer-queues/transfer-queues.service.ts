import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';
import { IntersolveVisaTransferJobDto } from '@121-service/src/transfer-queues/dto/create-intersolve-visa-transfer-job.dto';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';

@Injectable()
export class TransferQueuesService {
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(QueueNamePayment.paymentIntersolveVisa)
    private readonly paymentIntersolveVisaQueue: Queue,
  ) {}

  public async addIntersolveVisaTransferJobs(
    transferJobs: IntersolveVisaTransferJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job = await this.paymentIntersolveVisaQueue.add(
        ProcessNamePayment.sendPayment,
        transferJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }
}

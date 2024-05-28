import { Injectable } from '@nestjs/common';
//TODO: Uncomment all below, some imports and constructor stuff needed to work with the queues.
//import { InjectQueue } from '@nestjs/bull';
//import { Queue } from 'bull';
//import Redis from 'ioredis';
// import {
//   ProcessNamePayment,
//   QueueNamePayment,
// } from '../payments/enum/queue.names.enum';

//import { REDIS_CLIENT, getRedisSetName } from '../payments/redis-client';
import { CreateIntersolveVisaTransferJobDto } from '@121-service/src/transfer-queues/dto/create-intersolve-visa-transfer-job.dto';

@Injectable()
export class TransferQueuesService {
  //public constructor() {} private readonly redisClient: Redis, @Inject(REDIS_CLIENT) private readonly paymentIntersolveVisaQueue: Queue, @InjectQueue(QueueNamePayment.paymentIntersolveVisa)

  // TODO: Does this function need to be async?
  public async addIntersolveVisaTransferJobs(
    _transferJobs: CreateIntersolveVisaTransferJobDto[],
  ): Promise<void> {
    /* TODO: Implement function:
    - Remove _ from input parameter
    - Add jobs to queue
    - Add Redis set thing for monitoring in progress payments.
  */
  }
}

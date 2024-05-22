import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Redis from 'ioredis';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '../payments/enum/queue.names.enum';

import { REDIS_CLIENT, getRedisSetName } from '../payments/redis-client';
import { CreateIntersolveVisaTransferJobDto } from './dto/create-intersolve-visa-transfer-job.dto';

@Injectable()
export class TransferQueuesService {

  public constructor(
    @InjectQueue(QueueNamePayment.paymentIntersolveVisa)
    private readonly paymentIntersolveVisaQueue: Queue,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  // TODO: Does this function need to be async?
 public async addIntersolveVisaTransferJobs(transferJobs: CreateIntersolveVisaTransferJobDto[]): Promise<void> {
  /* TODO: Implement function:
    ..
    
  */

 }
}

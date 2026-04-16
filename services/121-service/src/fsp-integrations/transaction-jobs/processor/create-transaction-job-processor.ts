import { Inject, Type } from '@nestjs/common';
import Redis from 'ioredis';

import { BaseTransactionJobProcessor } from '@121-service/src/fsp-integrations/transaction-jobs/processor/base-transaction-job.processor';
import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/transaction-job-service.interface';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';

export function createTransactionJobProcessor(
  queueName: QueueNames,
  serviceToken: Type<TransactionJobService>,
): Type<BaseTransactionJobProcessor> {
  @RegisteredProcessor(queueName)
  class TransactionJobProcessor extends BaseTransactionJobProcessor {
    constructor(
      @Inject(serviceToken) service: TransactionJobService,
      @Inject(REDIS_CLIENT) redisClient: Redis,
    ) {
      super(service, redisClient);
    }
  }
  return TransactionJobProcessor;
}

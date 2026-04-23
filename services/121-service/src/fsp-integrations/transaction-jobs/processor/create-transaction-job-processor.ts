import { Inject, Type } from '@nestjs/common';
import Redis from 'ioredis';

import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/transaction-job-service.interface';
import { BaseTransactionJobProcessor } from '@121-service/src/fsp-integrations/transaction-jobs/processor/base-transaction-job.processor';
import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';

export function createTransactionJobProcessor<T extends SharedTransactionJobDto>(
  queueName: QueueNames,
  serviceToken: Type<TransactionJobService<T>>,
): Type<BaseTransactionJobProcessor<T>> {
  @RegisteredProcessor(queueName)
  class TransactionJobProcessor extends BaseTransactionJobProcessor<T> {
    constructor(
      @Inject(serviceToken) service: TransactionJobService<T>,
      @Inject(REDIS_CLIENT) redisClient: Redis,
    ) {
      super(service, redisClient);
    }
  }
  Object.defineProperty(TransactionJobProcessor, 'name', {
    value: `TransactionJobProcessor_${queueName}`,
  });
  return TransactionJobProcessor;
}

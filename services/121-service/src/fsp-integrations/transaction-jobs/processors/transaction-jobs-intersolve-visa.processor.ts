import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

import { BaseTransactionJobProcessor } from '@121-service/src/fsp-integrations/transaction-jobs/processors/base-transaction-job.processor';
import { TransactionJobsIntersolveVisaService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-intersolve-visa.service';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';

@RegisteredProcessor(QueueNames.transactionJobsIntersolveVisa)
export class TransactionJobsProcessorIntersolveVisa extends BaseTransactionJobProcessor {
  constructor(
    transactionJobsIntersolveVisaService: TransactionJobsIntersolveVisaService,
    @Inject(REDIS_CLIENT) redisClient: Redis,
  ) {
    super(transactionJobsIntersolveVisaService, redisClient);
  }
}

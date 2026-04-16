import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

import { BaseTransactionJobProcessor } from '@121-service/src/fsp-integrations/transaction-jobs/processors/base-transaction-job.processor';
import { TransactionJobsNedbankService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-nedbank.service';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';

@RegisteredProcessor(QueueNames.transactionJobsNedbank)
export class TransactionJobsProcessorNedbank extends BaseTransactionJobProcessor {
  constructor(
    transactionJobsNedbankService: TransactionJobsNedbankService,
    @Inject(REDIS_CLIENT) redisClient: Redis,
  ) {
    super(transactionJobsNedbankService, redisClient);
  }
}

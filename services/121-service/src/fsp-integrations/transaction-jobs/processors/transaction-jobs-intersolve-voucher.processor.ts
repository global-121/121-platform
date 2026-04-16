import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

import { BaseTransactionJobProcessor } from '@121-service/src/fsp-integrations/transaction-jobs/processors/base-transaction-job.processor';
import { TransactionJobsIntersolveVoucherService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-intersolve-voucher.service';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';

@RegisteredProcessor(QueueNames.transactionJobsIntersolveVoucher)
export class TransactionJobsProcessorIntersolveVoucher extends BaseTransactionJobProcessor {
  constructor(
    transactionJobsIntersolveVoucherService: TransactionJobsIntersolveVoucherService,
    @Inject(REDIS_CLIENT) redisClient: Redis,
  ) {
    super(transactionJobsIntersolveVoucherService, redisClient);
  }
}

// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not depend on any other 121 Service Modules.
import { Module } from '@nestjs/common';

import { TransactionQueuesService } from '@121-service/src/fsp-integrations/transaction-queues/transaction-queues.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';

@Module({
  imports: [RedisModule, QueuesRegistryModule],
  providers: [TransactionQueuesService],
  exports: [TransactionQueuesService],
})
export class TransactionQueuesModule {}

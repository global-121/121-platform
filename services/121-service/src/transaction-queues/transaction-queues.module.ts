// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { Module } from '@nestjs/common';

import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueueRegistryModule } from '@121-service/src/queue-registry/queue-registry.module';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';

@Module({
  imports: [RedisModule, QueueRegistryModule],
  providers: [TransactionQueuesService],
  exports: [TransactionQueuesService],
})
export class TransactionQueuesModule {}

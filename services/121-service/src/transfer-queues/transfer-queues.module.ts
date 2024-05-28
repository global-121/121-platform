// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { TransferQueuesService } from '@121-service/src/transfer-queues/transfer-queues.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [TransferQueuesService],
  exports: [TransferQueuesService],
})
export class TransferQueuesModule {}

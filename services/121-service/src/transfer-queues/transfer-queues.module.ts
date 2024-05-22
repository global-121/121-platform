import { Module } from '@nestjs/common';
import { TransferQueuesService } from './transfer-queues.service';

@Module({
  providers: [TransferQueuesService],
})
export class TransferQueuesModule {}

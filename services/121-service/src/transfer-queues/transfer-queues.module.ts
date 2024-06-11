// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { RedisModule } from '@121-service/src/payments/redis.module';
import { TransferQueuesService } from '@121-service/src/transfer-queues/transfer-queues.service';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RedisModule,
    BullModule.registerQueue({
      name: QueueNamePayment.paymentIntersolveVisa,
      processors: [
        {
          path: 'src/payments/fsp-integration/intersolve-visa/processors/intersolve-visa.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [TransferQueuesService],
  exports: [TransferQueuesService],
})
export class TransferQueuesModule {}

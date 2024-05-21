import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
} from '@121-service/src/notifications/enum/queue.names.enum';
import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { QueueSeedHelperService } from '@121-service/src/scripts/queue-seed-helper/queue-seed-helper.service';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.registerQueue(
      ...Object.values(QueueNamePayment).map((name) => ({ name })),
      ...Object.values(QueueNameCreateMessage).map((name) => ({ name })),
      ...Object.values(QueueNameMessageCallBack).map((name) => ({ name })),
    ),
  ],
  providers: [QueueSeedHelperService],
  exports: [QueueSeedHelperService],
})
export class QueueSeedHelperModule {}

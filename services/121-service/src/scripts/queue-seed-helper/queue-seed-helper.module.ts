import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
} from '../../notifications/enum/queue.names.enum';
import { QueueNamePayment } from '../../payments/enum/queue.names.enum';
import { QueueSeedHelperService } from './queue-seed-helper.service';

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

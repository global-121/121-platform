import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { QueueSeedHelperService } from '@121-service/src/scripts/queue-seed-helper/queue-seed-helper.service';
import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { TransactionJobQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';

@Module({
  imports: [
    BullModule.registerQueue(
      ...Object.values(TransactionJobQueueNames).map((name) => ({ name })),
      ...Object.values(QueueNameCreateMessage).map((name) => ({ name })),
      ...Object.values(QueueNameMessageCallBack).map((name) => ({ name })),
    ),
  ],
  providers: [QueueSeedHelperService],
  exports: [QueueSeedHelperService],
})
export class QueueSeedHelperModule {}

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { SafaricomCallbackQueueNames } from '@121-service/src/payments/fsp-integration/safaricom/enum/safaricom-callback-queue-names.enum';
import { QueueHelperService } from '@121-service/src/scripts/queue-helper/queue-helper.service';
import {
  QueueNameCreateMessage,
  QueueNameMessageCallBack,
  QueueNameRegistration,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { TransactionJobQueueNames } from '@121-service/src/shared/enum/transaction-job-queue-names.enum';

@Module({
  imports: [
    BullModule.registerQueue(
      ...Object.values(TransactionJobQueueNames).map((name) => ({ name })),
      ...Object.values(QueueNameCreateMessage).map((name) => ({ name })),
      ...Object.values(QueueNameMessageCallBack).map((name) => ({ name })),
      ...Object.values(QueueNameRegistration).map((name) => ({ name })),
      ...Object.values(SafaricomCallbackQueueNames).map((name) => ({ name })),
    ),
  ],
  providers: [QueueHelperService],
  exports: [QueueHelperService],
})
export class QueueHelperModule {}

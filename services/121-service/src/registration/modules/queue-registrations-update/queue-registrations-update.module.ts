import { Module } from '@nestjs/common';

import { QueuesModule } from '@121-service/src/queues/queues.module';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/modules/queue-registrations-update/queue-registrations-update.service';

@Module({
  imports: [QueuesModule],
  providers: [QueueRegistrationUpdateService],
  controllers: [],
  exports: [QueueRegistrationUpdateService],
})
export class QueueRegistrationUpdateModule {}

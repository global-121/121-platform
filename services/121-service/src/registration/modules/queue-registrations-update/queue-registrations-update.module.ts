import { QueueNameRegistration } from '@121-service/src/notifications/enum/queue.names.enum';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/modules/queue-registrations-update/queue-registrations-update.service';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueNameRegistration.registration,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 2,
        },
      ],
      limiter: {
        // 83.33 minutes for 100.000 PA
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [QueueRegistrationUpdateService],
  controllers: [],
  exports: [QueueRegistrationUpdateService],
})
export class QueueRegistrationUpdateModule {}

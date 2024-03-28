import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QueueNameRegistration } from '../../../notifications/enum/queue.names.enum';
import { QueueRegistrationUpdateService } from './queue-registrations-update.service';

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

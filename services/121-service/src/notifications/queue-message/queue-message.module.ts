import { Module } from '@nestjs/common';
import { QueueMessageService } from './queue-message.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message',
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 8,
        },
      ],
      limiter: {
        max: 10, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [QueueMessageService],
  controllers: [],
  exports: [QueueMessageService, BullModule],
})
export class QueueMessageModule {}

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramAttributesModule } from '../../program-attributes/program-attributes.module';
import { QueueNameCreateMessage } from '../enum/queue.names.enum';
import { MessageTemplateEntity } from '../message-template/message-template.entity';
import { QueueMessageService } from './queue-message.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplateEntity]),
    ProgramAttributesModule,
    BullModule.registerQueue({
      name: QueueNameCreateMessage.replyOnIncoming,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 2,
        },
      ],
      limiter: {
        max: 8, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNameCreateMessage.smallBulk,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 4, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNameCreateMessage.mediumBulk,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 4, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNameCreateMessage.largeBulk,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 4, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: QueueNameCreateMessage.lowPriority,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 1,
        },
      ],
      limiter: {
        max: 2, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [QueueMessageService],
  controllers: [],
  exports: [QueueMessageService, BullModule],
})
export class QueueMessageModule {}

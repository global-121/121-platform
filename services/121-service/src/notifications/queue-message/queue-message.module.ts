import { QueueNameCreateMessage } from '@121-service/src/notifications/enum/queue.names.enum';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplateEntity]),
    ProgramAttributesModule,
    RegistrationDataModule,
    BullModule.registerQueue({
      name: QueueNameCreateMessage.replyOnIncoming,
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 2,
        },
      ],
      limiter: {
        max: 24, // Max number of jobs processed
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

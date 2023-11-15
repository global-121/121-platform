import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { SmsModule } from './sms/sms.module';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { BullModule } from '@nestjs/bull';
import { MessageProcessor } from './processors/message.processor';
import { AzureLogService } from '../shared/services/azure-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TryWhatsappEntity]),
    WhatsappModule,
    SmsModule,
    BullModule.registerQueue({
      name: 'message',
      processors: [
        {
          path: 'src/notifications/processors/message.processor.ts',
          concurrency: 16,
        },
      ],
      limiter: {
        max: 50, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [MessageService, MessageProcessor, AzureLogService],
  controllers: [],
  exports: [MessageService, BullModule],
})
export class MessageModule {}

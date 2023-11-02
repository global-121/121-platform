import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { SmsModule } from './sms/sms.module';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { BullModule } from '@nestjs/bull';
import { MessageProcessor } from './processors/message.processor';

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
        },
      ],
    }),
  ],
  providers: [MessageService, MessageProcessor],
  controllers: [],
  exports: [MessageService, BullModule],
})
export class MessageModule {}

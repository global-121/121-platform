import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { SmsModule } from './sms/sms.module';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { MessageTemplateModule } from './message-template/message-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TryWhatsappEntity]),
    WhatsappModule,
    SmsModule,
    MessageTemplateModule,
  ],
  providers: [MessageService],
  controllers: [],
  exports: [MessageService],
})
export class MessageModule {}

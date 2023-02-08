import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { SmsModule } from './sms/sms.module';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TryWhatsappEntity]),
    forwardRef(() => WhatsappModule),
    SmsModule,
  ],
  providers: [MessageService],
  controllers: [],
  exports: [MessageService],
})
export class MessageModule {}

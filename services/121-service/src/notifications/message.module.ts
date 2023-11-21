import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { SmsModule } from './sms/sms.module';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { MessageProcessor } from './processors/message.processor';
import { AzureLogService } from '../shared/services/azure-log.service';
import { RegistrationEntity } from '../registration/registration.entity';
import { WhatsappPendingMessageEntity } from './whatsapp/whatsapp-pending-message.entity';
import { QueueMessageModule } from './queue-message/queue-message.module';
import { IntersolveVoucherModule } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { MessageTemplateModule } from './message-template/message-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TryWhatsappEntity,
      RegistrationEntity,
      WhatsappPendingMessageEntity,
    ]),
    WhatsappModule,
    SmsModule,
    QueueMessageModule,
    IntersolveVoucherModule,
    MessageTemplateModule,
  ],
  providers: [MessageService, MessageProcessor, AzureLogService],
  controllers: [],
  exports: [MessageService],
})
export class MessageModule {}

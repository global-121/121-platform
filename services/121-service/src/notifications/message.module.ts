import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntersolveVoucherModule } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { ProgramModule } from '../programs/programs.module';
import { RegistrationEntity } from '../registration/registration.entity';
import { AzureLogService } from '../shared/services/azure-log.service';
import { MessageTemplateEntity } from './message-template/message-template.entity';
import { MessageTemplateModule } from './message-template/message-template.module';
import { MessageService } from './message.service';
import {
  MessageProcessorLargeBulk,
  MessageProcessorLowPriority,
  MessageProcessorMediumBulk,
  MessageProcessorReplyOnIncoming,
  MessageProcessorSmallBulk,
} from './processors/message.processor';
import { QueueMessageModule } from './queue-message/queue-message.module';
import { SmsModule } from './sms/sms.module';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from './whatsapp/whatsapp-pending-message.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TryWhatsappEntity,
      RegistrationEntity,
      WhatsappPendingMessageEntity,
      MessageTemplateEntity,
    ]),
    WhatsappModule,
    SmsModule,
    QueueMessageModule,
    IntersolveVoucherModule,
    MessageTemplateModule,
    ProgramModule,
  ],
  providers: [
    MessageService,
    MessageProcessorReplyOnIncoming,
    MessageProcessorSmallBulk,
    MessageProcessorMediumBulk,
    MessageProcessorLargeBulk,
    MessageProcessorLowPriority,
    AzureLogService,
  ],
  controllers: [],
  exports: [MessageService],
})
export class MessageModule {}

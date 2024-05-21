import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { MessageService } from '@121-service/src/notifications/message.service';
import {
  MessageProcessorLargeBulk,
  MessageProcessorLowPriority,
  MessageProcessorMediumBulk,
  MessageProcessorReplyOnIncoming,
  MessageProcessorSmallBulk,
} from '@121-service/src/notifications/processors/message.processor';
import { QueueMessageModule } from '@121-service/src/notifications/queue-message/queue-message.module';
import { SmsModule } from '@121-service/src/notifications/sms/sms.module';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { WhatsappModule } from '@121-service/src/notifications/whatsapp/whatsapp.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageService } from '@121-service/src/notifications/message.service';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import {
  MessageProcessorLargeBulk,
  MessageProcessorLowPriority,
  MessageProcessorMediumBulk,
  MessageProcessorReplyOnIncoming,
  MessageProcessorSmallBulk,
} from '@121-service/src/notifications/processors/message.processor';
import { SmsModule } from '@121-service/src/notifications/sms/sms.module';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TwilioMessageScopedRepository } from '@121-service/src/notifications/twilio-message.repository';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappModule } from '@121-service/src/notifications/whatsapp/whatsapp.module';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TryWhatsappEntity,
      RegistrationEntity,
      WhatsappPendingMessageEntity,
      MessageTemplateEntity,
      TwilioMessageEntity,
    ]),
    WhatsappModule,
    SmsModule,
    MessageQueuesModule,
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
    TwilioMessageScopedRepository,
  ],
  controllers: [],
  exports: [MessageService, TwilioMessageScopedRepository],
})
export class MessageModule {}

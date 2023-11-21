import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { API_PATHS } from '../../config';
import { IntersolveVoucherEntity } from '../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { ImageCodeModule } from '../../payments/imagecode/image-code.module';
import { TransactionEntity } from '../../payments/transactions/transaction.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { UserModule } from '../../user/user.module';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import { LastMessageStatusService } from '../last-message-status.service';
import { SmsService } from '../sms/sms.service';
import { TwilioMessageEntity } from '../twilio.entity';
import { MessageIncomingController } from './message-incoming.controller';
import { MessageIncomingService } from './message-incoming.service';
import { BullModule } from '@nestjs/bull';
import { MessageStatusCallbackProcessor } from '../processors/message-status-callback.processor';
import { AzureLogService } from '../../shared/services/azure-log.service';
import { QueueMessageModule } from '../queue-message/queue-message.module';
import { LatestMessageEntity } from '../latest-message.entity';
import { IntersolveVoucherModule } from './../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { TryWhatsappEntity } from '../whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '../whatsapp/whatsapp-pending-message.entity';
import { WhatsappTemplateTestEntity } from '../whatsapp/whatsapp-template-test.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { MessageTemplateModule } from '../message-template/message-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      IntersolveVoucherEntity,
      TransactionEntity,
      ProgramEntity,
      RegistrationEntity,
      TransactionEntity,
      WhatsappPendingMessageEntity,
      TryWhatsappEntity,
      WhatsappPendingMessageEntity,
      WhatsappTemplateTestEntity,
      LatestMessageEntity,
    ]),
    ImageCodeModule,
    UserModule,
    IntersolveVoucherModule,
    WhatsappModule,
    QueueMessageModule,
    BullModule.registerQueue({
      name: 'messageStatusCallback',
      processors: [
        {
          path: 'src/notifications/processors/message-status-callback.processor.ts',
          concurrency: 4,
        },
      ],
      limiter: {
        max: 50, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [
    MessageIncomingService,
    SmsService,
    MessageStatusCallbackProcessor,
    AzureLogService,
    LastMessageStatusService,
    MessageTemplateModule,
  ],
  controllers: [MessageIncomingController],
  exports: [MessageIncomingService, BullModule],
})
export class MessageIncomingModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddlewareTwilio).forRoutes(
      {
        path: API_PATHS.whatsAppStatus,
        method: RequestMethod.POST,
      },
      {
        path: API_PATHS.whatsAppIncoming,
        method: RequestMethod.POST,
      },
    );
  }
}

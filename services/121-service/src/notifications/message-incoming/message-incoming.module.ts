import { API_PATHS } from '@121-service/src/config';
import { AuthMiddlewareTwilio } from '@121-service/src/notifications/auth.middlewareTwilio';
import { MessageIncomingController } from '@121-service/src/notifications/message-incoming/message-incoming.controller';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { MessageIncomingProcessor } from '@121-service/src/notifications/processors/message-incoming.processor';
import { MessageStatusCallbackProcessor } from '@121-service/src/notifications/processors/message-status-callback.processor';
import { QueueMessageModule } from '@121-service/src/notifications/queue-message/queue-message.module';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { WhatsappModule } from '@121-service/src/notifications/whatsapp/whatsapp.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { ImageCodeModule } from '@121-service/src/payments/imagecode/image-code.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { QueueNameMessageCallBack } from '@121-service/src/shared/enum/queue-process.names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserModule } from '@121-service/src/user/user.module';
import { BullModule } from '@nestjs/bull';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      TransactionEntity,
      ProgramEntity,
      RegistrationEntity,
      WhatsappPendingMessageEntity,
      TryWhatsappEntity,
    ]),
    ImageCodeModule,
    UserModule,
    IntersolveVoucherModule,
    WhatsappModule,
    QueueMessageModule,
    MessageTemplateModule,
    RegistrationDataModule,
    BullModule.registerQueue({
      name: QueueNameMessageCallBack.status,
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
    BullModule.registerQueue({
      name: QueueNameMessageCallBack.incomingMessage,
      processors: [
        {
          path: 'src/notifications/processors/message-incoming.processor.ts',
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
    MessageStatusCallbackProcessor,
    MessageIncomingProcessor,
    AzureLogService,
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

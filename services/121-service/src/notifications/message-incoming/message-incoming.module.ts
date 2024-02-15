import { BullModule } from '@nestjs/bull';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { API_PATHS } from '../../config';
import { ImageCodeModule } from '../../payments/imagecode/image-code.module';
import { TransactionEntity } from '../../payments/transactions/transaction.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationDataModule } from '../../registration/modules/registration-data/registration-data.module';
import { RegistrationEntity } from '../../registration/registration.entity';
import { AzureLogService } from '../../shared/services/azure-log.service';
import { UserModule } from '../../user/user.module';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import { QueueNameMessageCallBack } from '../enum/queue.names.enum';
import { MessageTemplateModule } from '../message-template/message-template.module';
import { MessageIncomingProcessor } from '../processors/message-incoming.processor';
import { MessageStatusCallbackProcessor } from '../processors/message-status-callback.processor';
import { QueueMessageModule } from '../queue-message/queue-message.module';
import { TwilioMessageEntity } from '../twilio.entity';
import { TryWhatsappEntity } from '../whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '../whatsapp/whatsapp-pending-message.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { IntersolveVoucherModule } from './../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { MessageIncomingController } from './message-incoming.controller';
import { MessageIncomingService } from './message-incoming.service';

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

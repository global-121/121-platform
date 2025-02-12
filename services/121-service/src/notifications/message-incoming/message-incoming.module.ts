import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { API_PATHS } from '@121-service/src/config';
import { AuthMiddlewareTwilio } from '@121-service/src/notifications/auth.middlewareTwilio';
import { MessageIncomingController } from '@121-service/src/notifications/message-incoming/message-incoming.controller';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { MessageIncomingProcessor } from '@121-service/src/notifications/processors/message-incoming.processor';
import { MessageStatusCallbackProcessor } from '@121-service/src/notifications/processors/message-status-callback.processor';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappModule } from '@121-service/src/notifications/whatsapp/whatsapp.module';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { ImageCodeModule } from '@121-service/src/payments/imagecode/image-code.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProjectEntity } from '@121-service/src/programs/project.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      TransactionEntity,
      ProjectEntity,
      RegistrationEntity,
      WhatsappPendingMessageEntity,
      TryWhatsappEntity,
      UserEntity,
    ]),
    ImageCodeModule,
    UserModule,
    IntersolveVoucherModule,
    WhatsappModule,
    MessageQueuesModule,
    MessageTemplateModule,
    RegistrationDataModule,
    QueuesRegistryModule,
  ],
  providers: [
    MessageIncomingService,
    MessageStatusCallbackProcessor,
    MessageIncomingProcessor,
    AzureLogService,
  ],
  controllers: [MessageIncomingController],
  exports: [MessageIncomingService],
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

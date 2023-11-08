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
import { IntersolveVoucherModule } from '../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { TryWhatsappEntity } from './try-whatsapp.entity';
import { MessageIncomingController } from './message-incoming.controller';
import { MessageIncomingService } from './message-incoming.service';
import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';
import { WhatsappModule } from './whatsapp.module';
import { BullModule } from '@nestjs/bull';
import { MessageStatusCallbackProcessor } from '../processors/message-status-callback.processor';

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
    ]),
    ImageCodeModule,
    UserModule,
    IntersolveVoucherModule,
    WhatsappModule,
    BullModule.registerQueue({
      name: 'messageStatusCallback',
      processors: [
        {
          path: 'src/notifications/processors/message-status-callback.processor.ts',
        },
      ],
      limiter: {
        max: 600, // Max number of jobs processed
        duration: 60000, // per duration in milliseconds
      },
    }),
  ],
  providers: [
    MessageIncomingService,
    SmsService,
    LastMessageStatusService,
    MessageStatusCallbackProcessor,
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

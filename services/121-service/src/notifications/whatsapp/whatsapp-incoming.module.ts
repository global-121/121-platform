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
import { IntersolveVoucherModule } from './../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { TryWhatsappEntity } from './try-whatsapp.entity';
import { WhatsappIncomingController } from './whatsapp-incoming.controller';
import { WhatsappIncomingService } from './whatsapp-incoming.service';
import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';
import { WhatsappModule } from './whatsapp.module';
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
    ]),
    ImageCodeModule,
    UserModule,
    IntersolveVoucherModule,
    WhatsappModule,
    MessageTemplateModule,
  ],
  providers: [WhatsappIncomingService, SmsService, LastMessageStatusService],
  controllers: [WhatsappIncomingController],
  exports: [WhatsappIncomingService],
})
export class WhatsappIncomingModule implements NestModule {
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

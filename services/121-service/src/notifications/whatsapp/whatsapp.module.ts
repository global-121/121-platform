import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { API_PATHS } from '../../config';
import { IntersolveBarcodeEntity } from '../../payments/fsp-integration/intersolve/intersolve-barcode.entity';
import { IntersolveModule } from '../../payments/fsp-integration/intersolve/intersolve.module';
import { ImageCodeModule } from '../../payments/imagecode/image-code.module';
import { TransactionEntity } from '../../payments/transactions/transaction.entity';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import { TwilioMessageEntity } from '../twilio.entity';
import { ProgramEntity } from './../../programs/program.entity';
import { RegistrationEntity } from './../../registration/registration.entity';
import { UserModule } from './../../user/user.module';
import { SmsService } from './../sms/sms.service';
import { TryWhatsappEntity } from './try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      IntersolveBarcodeEntity,
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
    forwardRef(() => IntersolveModule),
  ],
  providers: [WhatsappService, SmsService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule implements NestModule {
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

import { SmsService } from './../sms/sms.service';
import { InstanceEntity } from './../../instance/instance.entity';
import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import { RegistrationEntity } from './../../registration/registration.entity';
import { ProgramEntity } from './../../programs/program.entity';
import { TransactionEntity } from '../../payments/transactions/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
  forwardRef,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TwilioMessageEntity } from '../twilio.entity';
import { ImageCodeModule } from '../../payments/imagecode/image-code.module';
import { API_PATHS } from '../../config';
import { IntersolveBarcodeEntity } from '../../payments/fsp-integration/intersolve/intersolve-barcode.entity';
import { IntersolveModule } from '../../payments/fsp-integration/intersolve/intersolve.module';
import { TryWhatsappEntity } from './try-whatsapp.entity';

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
    ]),
    ImageCodeModule,
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

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { API_PATHS } from '../../config';
import { ImageCodeModule } from '../../payments/imagecode/image-code.module';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import { LastMessageStatusService } from '../last-message-status.service';
import { LatestMessageEntity } from '../latest-message.entity';
import { MessageTemplateModule } from '../message-template/message-template.module';
import { TwilioMessageEntity } from '../twilio.entity';
import { ProgramEntity } from './../../programs/program.entity';
import { UserModule } from './../../user/user.module';
import { WhatsappTemplateTestEntity } from './whatsapp-template-test.entity';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      ProgramEntity,
      WhatsappTemplateTestEntity,
      LatestMessageEntity,
    ]),
    ImageCodeModule,
    UserModule,
    MessageTemplateModule,
  ],
  providers: [WhatsappService, LastMessageStatusService],
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

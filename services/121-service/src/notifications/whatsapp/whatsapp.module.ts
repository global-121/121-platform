import { API_PATHS } from '@121-service/src/config';
import { AuthMiddlewareTwilio } from '@121-service/src/notifications/auth.middlewareTwilio';
import { LastMessageStatusService } from '@121-service/src/notifications/last-message-status.service';
import { LatestMessageEntity } from '@121-service/src/notifications/latest-message.entity';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { WhatsappTemplateTestEntity } from '@121-service/src/notifications/whatsapp/whatsapp-template-test.entity';
import { WhatsappController } from '@121-service/src/notifications/whatsapp/whatsapp.controller';
import { WhatsappService } from '@121-service/src/notifications/whatsapp/whatsapp.service';
import { ImageCodeModule } from '@121-service/src/payments/imagecode/image-code.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { UserModule } from '@121-service/src/user/user.module';
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

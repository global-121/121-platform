import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { API_PATHS } from '@121-service/src/config';
import { AuthMiddlewareTwilio } from '@121-service/src/notifications/auth.middlewareTwilio';
import { LatestMessageEntity } from '@121-service/src/notifications/entities/latest-message.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { LastMessageStatusService } from '@121-service/src/notifications/services/last-message-status.service';
import { WhatsappController } from '@121-service/src/notifications/whatsapp/whatsapp.controller';
import { WhatsappService } from '@121-service/src/notifications/whatsapp/whatsapp.service';
import { WhatsappTemplateTestEntity } from '@121-service/src/notifications/whatsapp/whatsapp-template-test.entity';
import { ImageCodeModule } from '@121-service/src/payments/imagecode/image-code.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { UserModule } from '@121-service/src/user/user.module';

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

import { API_PATHS } from '@121-service/src/config';
import { AuthMiddlewareTwilio } from '@121-service/src/notifications/auth.middlewareTwilio';
import { LastMessageStatusService } from '@121-service/src/notifications/last-message-status.service';
import { LatestMessageEntity } from '@121-service/src/notifications/latest-message.entity';
import { SmsService } from '@121-service/src/notifications/sms/sms.service';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([TwilioMessageEntity, LatestMessageEntity]),
  ],
  providers: [SmsService, LastMessageStatusService],
  controllers: [],
  exports: [SmsService],
})
export class SmsModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddlewareTwilio).forRoutes({
      path: API_PATHS.smsStatus,
      method: RequestMethod.POST,
    });
  }
}

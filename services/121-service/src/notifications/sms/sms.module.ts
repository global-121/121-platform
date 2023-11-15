import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { API_PATHS } from '../../config';
import { RegistrationEntity } from '../../registration/registration.entity';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import { LastMessageStatusService } from '../last-message-status.service';
import { TwilioMessageEntity } from '../twilio.entity';
import { SmsService } from './sms.service';
import { LatestMessageEntity } from '../latest-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      RegistrationEntity,
      LatestMessageEntity,
    ]),
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

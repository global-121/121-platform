import { UserModule } from './../../user/user.module';
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwilioMessageEntity } from '../twilio.entity';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import { API_PATHS } from '../../config';

@Module({
  imports: [TypeOrmModule.forFeature([TwilioMessageEntity]), UserModule],
  providers: [VoiceService],
  controllers: [VoiceController],
  exports: [VoiceService],
})
export class VoiceModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddlewareTwilio).forRoutes({
      path: API_PATHS.voiceStatus,
      method: RequestMethod.POST,
    });
  }
}

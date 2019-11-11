import { ProgramModule } from './../../programs/program/program.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { TwilioMessageEntity } from '../twilio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TwilioMessageEntity]), ProgramModule],
  providers: [SmsService],
  controllers: [SmsController],
  exports: [SmsService],
})
export class SmsModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareTwilio)
      .forRoutes({ path: 'sms/status', method: RequestMethod.POST });
  }
}

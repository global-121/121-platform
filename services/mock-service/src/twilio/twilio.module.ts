import { TwilioController } from '@mock-service/src/twilio/twilio.controller';
import { TwilioService } from '@mock-service/src/twilio/twilio.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [TwilioService],
  controllers: [TwilioController],
  exports: [TwilioService],
})
export class TwilioModule {}

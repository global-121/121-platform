import { Module } from '@nestjs/common';

import { TwilioController } from '@mock-service/src/twilio/twilio.controller';
import { TwilioService } from '@mock-service/src/twilio/twilio.service';

@Module({
  imports: [],
  providers: [TwilioService],
  controllers: [TwilioController],
  exports: [TwilioService],
})
export class TwilioModule {}

import { Module } from '@nestjs/common';
import { TwilioModule } from './twilio/twilio.module';

@Module({
  imports: [TwilioModule],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

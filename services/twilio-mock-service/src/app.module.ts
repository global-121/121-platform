import { Module } from '@nestjs/common';
import { TwilioModule } from './twilio/twilio.module';
import { LoadTestModule } from './load-test.ts/load-test.module';

@Module({
  imports: [TwilioModule, LoadTestModule],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

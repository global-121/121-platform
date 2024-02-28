import { Module } from '@nestjs/common';
import { SafaricomMockModule } from './fsp-integration/safaricom/safaricom.mock.module';
import { LoadTestModule } from './load-test.ts/load-test.module';
import { TwilioModule } from './twilio/twilio.module';
import { ResetModule } from './reset/reset.module';

@Module({
  imports: [TwilioModule, LoadTestModule, SafaricomMockModule, ResetModule],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

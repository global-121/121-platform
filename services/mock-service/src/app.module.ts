import { SafaricomMockModule } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.module';
import { LoadTestModule } from '@mock-service/src/load-test/load-test.module';
import { ResetModule } from '@mock-service/src/reset/reset.module';
import { TwilioModule } from '@mock-service/src/twilio/twilio.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [TwilioModule, LoadTestModule, SafaricomMockModule, ResetModule],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

import { SafaricomMockModule } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.module';
import { LoadTestModule } from '@mock-service/src/load-test/load-test.module';
import { ResetModule } from '@mock-service/src/reset/reset.module';
import { TwilioModule } from '@mock-service/src/twilio/twilio.module';
import { Module } from '@nestjs/common';
import { IntersolveVisaMockModule } from './fsp-integration/intersolve-visa/intersolve-visa.mock.module';

@Module({
  imports: [
    TwilioModule,
    LoadTestModule,
    SafaricomMockModule,
    ResetModule,
    IntersolveVisaMockModule,
  ],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

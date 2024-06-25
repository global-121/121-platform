import { IntersolveVisaMockModule } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.module';
import { SafaricomMockModule } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.module';
import { InstanceModule } from '@mock-service/src/instance.module';
import { LoadTestModule } from '@mock-service/src/load-test/load-test.module';
import { ResetModule } from '@mock-service/src/reset/reset.module';
import { TwilioModule } from '@mock-service/src/twilio/twilio.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    InstanceModule,
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

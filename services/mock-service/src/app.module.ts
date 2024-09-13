import { Module } from '@nestjs/common';

import { IntersolveVisaMockModule } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.module';
import { SafaricomMockModule } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.module';
import { InstanceModule } from '@mock-service/src/instance.module';
import { ResetModule } from '@mock-service/src/reset/reset.module';
import { TwilioModule } from '@mock-service/src/twilio/twilio.module';

@Module({
  imports: [
    InstanceModule,
    TwilioModule,
    SafaricomMockModule,
    ResetModule,
    IntersolveVisaMockModule,
  ],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

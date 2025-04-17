import { Module } from '@nestjs/common';

import { ExchangeRatesMockModule } from '@mock-service/src/exchange-rates/exchange-rates-mock.module';
import { CommercialBankEthiopiaMockModule } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock.module';
import { IntersolveVisaMockModule } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.module';
import { NedbankMockModule } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.module';
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
    ExchangeRatesMockModule,
    NedbankMockModule,
    CommercialBankEthiopiaMockModule,
  ],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

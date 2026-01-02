import { Module } from '@nestjs/common';

import { ExchangeRatesMockModule } from '@mock-service/src/exchange-rates/exchange-rates-mock.module';
import { AirtelMockModule } from '@mock-service/src/fsp-integration/airtel/airtel.mock.module';
import { CommercialBankEthiopiaMockModule } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock.module';
import { CooperativeBankOfOromiaMockModule } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.mock.module';
import { IntersolveVisaMockModule } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.module';
import { NedbankMockModule } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.module';
import { OnafriqMockModule } from '@mock-service/src/fsp-integration/onafriq/onafriq.mock.module';
import { SafaricomMockModule } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.module';
import { InstanceModule } from '@mock-service/src/instance.module';
import { KoboMockModule } from '@mock-service/src/kobo/kobo.mock.module';
import { ResetModule } from '@mock-service/src/reset/reset.module';
import { TwilioModule } from '@mock-service/src/twilio/twilio.module';

@Module({
  imports: [
    InstanceModule,
    TwilioModule,
    SafaricomMockModule,
    OnafriqMockModule,
    AirtelMockModule,
    CooperativeBankOfOromiaMockModule,
    ResetModule,
    IntersolveVisaMockModule,
    ExchangeRatesMockModule,
    NedbankMockModule,
    CommercialBankEthiopiaMockModule,
    KoboMockModule,
  ],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}

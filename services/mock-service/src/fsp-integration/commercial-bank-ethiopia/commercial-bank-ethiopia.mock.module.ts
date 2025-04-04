import { Module } from '@nestjs/common';

import { CommercialBankEthiopiaMockController } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock.controller';
import { CommercialBankEthiopiaMockService } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock.service';

@Module({
  imports: [],
  providers: [CommercialBankEthiopiaMockService],
  controllers: [CommercialBankEthiopiaMockController],
  exports: [CommercialBankEthiopiaMockService],
})
export class CommercialBankEthiopiaMockModule {}

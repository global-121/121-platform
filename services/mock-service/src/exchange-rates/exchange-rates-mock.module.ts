import { Module } from '@nestjs/common';

import { ExchangeRatesMockController } from '@mock-service/src/exchange-rates/exchange-rates-mock.controller';
import { ExchangeRatesMockService } from '@mock-service/src/exchange-rates/exchange-rates-mock.service';

@Module({
  imports: [],
  providers: [ExchangeRatesMockService],
  controllers: [ExchangeRatesMockController],
  exports: [ExchangeRatesMockService],
})
export class ExchangeRatesMockModule {}

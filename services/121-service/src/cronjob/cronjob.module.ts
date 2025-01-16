import { Module } from '@nestjs/common';

import { CronjobService } from '@121-service/src/cronjob/cronjob.service';
import { ExchangeRatesModule } from '@121-service/src/exchange-rates/exchange-rates.module';

@Module({
  imports: [ExchangeRatesModule],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}

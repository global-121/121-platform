import { Module } from '@nestjs/common';

import { CronjobService } from '@121-service/src/cronjob/cronjob.service';
import { ExchangeRateModule } from '@121-service/src/exchange-rate/exchange-rate.module';

@Module({
  imports: [ExchangeRateModule],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}

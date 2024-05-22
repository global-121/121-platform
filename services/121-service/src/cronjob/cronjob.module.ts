import { CronjobService } from '@121-service/src/cronjob/cronjob.service';
import { ExchangeRateModule } from '@121-service/src/exchange-rate/exchange-rate.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ExchangeRateModule],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}

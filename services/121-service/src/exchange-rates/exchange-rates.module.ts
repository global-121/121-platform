import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { ExchangeRatesApiService } from '@121-service/src/exchange-rates/exchange-rates.api.service';
import { ExchangeRatesController } from '@121-service/src/exchange-rates/exchange-rates.controller';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/exchange-rates.service';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExchangeRateEntity, ProjectEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [
    ExchangeRatesService,
    CustomHttpService,
    AzureLogService,
    ExchangeRatesApiService,
  ],
  controllers: [ExchangeRatesController],
  exports: [ExchangeRatesService, ExchangeRatesApiService],
})
export class ExchangeRatesModule {}

import { ExchangeRateApiService } from '@121-service/src/exchange-rate/exchange-rate.api.service';
import { ExchangeRateEntity } from '@121-service/src/exchange-rate/exchange-rate.entity';
import { ExchangeRateService } from '@121-service/src/exchange-rate/exchange-rate.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExchangeRateEntity, ProgramEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [ExchangeRateService, CustomHttpService, ExchangeRateApiService],
  controllers: [],
  exports: [ExchangeRateService, ExchangeRateApiService],
})
export class ExchangeRateModule {}

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsService } from '../guards/guards.service';
import { ProgramEntity } from '../programs/program.entity';
import { CustomHttpService } from '../shared/services/custom-http.service';
import { UserModule } from '../user/user.module';
import { ExchangeRateEntity } from './exchange-rate.entity';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExchangeRateEntity, ProgramEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [GuardsService, ExchangeRateService, CustomHttpService],
  controllers: [],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}

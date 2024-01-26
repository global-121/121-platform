import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsService } from '../guards/guards.service';
import { ProgramEntity } from '../programs/program.entity';
import { UserModule } from '../user/user.module';
import { ExchangeRateEntity } from './exchange-rate.entity';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExchangeRateEntity, ProgramEntity]),
    UserModule,
  ],
  providers: [GuardsService, ExchangeRateService],
  controllers: [],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}

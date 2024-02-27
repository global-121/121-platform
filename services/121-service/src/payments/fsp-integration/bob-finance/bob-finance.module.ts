import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { RegistrationDataModule } from '../../../registration/modules/registration-data/registration-data.module';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { BobFinanceService } from './bob-finance.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature(),
    UserModule,
    TransactionsModule,
    RegistrationDataModule,
  ],
  providers: [BobFinanceService, LookupService],
  controllers: [],
  exports: [BobFinanceService],
})
export class BobFinanceModule {}

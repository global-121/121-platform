import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { BobFinanceService } from '@121-service/src/payments/fsp-integration/bob-finance/bob-finance.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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

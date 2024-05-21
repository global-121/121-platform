import { UkrPoshtaService } from '@121-service/src/payments/fsp-integration/ukrposhta/ukrposhta.service';
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
  providers: [UkrPoshtaService],
  controllers: [],
  exports: [UkrPoshtaService],
})
export class UkrPoshtaModule {}

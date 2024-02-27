import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationDataModule } from '../../../registration/modules/registration-data/registration-data.module';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { UkrPoshtaService } from './ukrposhta.service';

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

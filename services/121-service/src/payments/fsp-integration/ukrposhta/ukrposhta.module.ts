import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { UkrPoshtaService } from './ukrposhta.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature(),
    UserModule,
    TransactionsModule,
  ],
  providers: [UkrPoshtaService],
  controllers: [],
  exports: [UkrPoshtaService],
})
export class UkrPoshtaModule {}

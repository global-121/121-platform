import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { TransactionsModule } from '../../transactions/transactions.module';
import { ExcelService } from './excel.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature(), TransactionsModule],
  providers: [ExcelService, LookupService],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}

import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramEntity]),
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [ExcelService, LookupService],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationsModule } from '../../../registration/registrations.module';
import { RegistrationViewScopedRepository } from '../../../registration/repositories/registration-view-scoped.repository';
import { TransactionsModule } from '../../transactions/transactions.module';
import { ExcelService } from './excel.service';

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

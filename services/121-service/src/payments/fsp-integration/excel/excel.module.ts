import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationViewScopedRepository } from '../../../registration/registration-scoped.repository';
import { RegistrationsModule } from '../../../registration/registrations.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { ExcelService } from './excel.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramEntity]),
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [ExcelService, LookupService, RegistrationViewScopedRepository],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}

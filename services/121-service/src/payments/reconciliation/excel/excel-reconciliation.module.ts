import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { ExcelRecociliationController as ExcelReconciliationController } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.controller';
import { ExcelRecociliationService as ExcelReconciliationService } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProjectEntity]),
    ActionsModule,
    TransactionsModule,
    ExcelModule,
    RegistrationsModule,
  ],
  providers: [ExcelReconciliationService, FileImportService],
  controllers: [ExcelReconciliationController],
})
export class ExcelReconcilicationModule {}

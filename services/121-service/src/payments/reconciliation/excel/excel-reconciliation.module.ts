import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { PaymentsModule } from '@121-service/src/payments/payments.module';
import { ExcelReconciliationController } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.controller';
import { ExcelReconciliationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation.service';
import { ExcelReconciliationFeedbackService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-feedback.service';
import { ExcelReconciliationValidationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-validation.service';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramEntity]),
    ActionsModule,
    TransactionsModule,
    ExcelModule,
    RegistrationsModule,
    PaymentsModule,
    ProgramFspConfigurationsModule,
    ProgramModule,
    TransactionEventsModule,
  ],
  providers: [
    ExcelReconciliationService,
    ExcelReconciliationValidationService,
    FileImportService,
    ExcelReconciliationFeedbackService,
  ],
  controllers: [ExcelReconciliationController],
})
export class ExcelReconcilicationModule {}

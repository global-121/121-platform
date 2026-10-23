import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ExcelService } from '@121-service/src/fsp-integrations/integrations/excel/excel.service';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    ProgramFspConfigurationsModule,
    // TODO: Refactor this to not make excel module dependent TransactionsModule and RegistrationsModule
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    LookupService,
    FileImportService,
  ],
  exports: [ExcelService],
})
export class ExcelModule {}

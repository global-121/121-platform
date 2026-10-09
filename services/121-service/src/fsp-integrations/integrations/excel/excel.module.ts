import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExcelService } from '@121-service/src/fsp-integrations/integrations/excel/excel.service';
import { ExcelFspConfigurationController } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.controller';
import { ExcelFspConfigurationService } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.service';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramEntity, ProgramFspConfigurationEntity]),
    ProgramFspConfigurationsModule,
    // TODO: Refactor this to not make excel module dependent TransactionsModule and RegistrationsModule
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    ExcelFspConfigurationService,
    LookupService,
    FileImportService,
  ],
  controllers: [ExcelFspConfigurationController],
  exports: [ExcelService],
})
export class ExcelModule {}

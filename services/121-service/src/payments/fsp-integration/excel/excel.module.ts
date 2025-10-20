import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramEntity, ProgramFspConfigurationEntity]),
    // TODO: Refactor this to not make excel module dependent TransactionsModule and RegistrationsModule
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    LookupService,
    FileImportService,
    // TODO: Refactor this to not make excel module dependent on program Fsp configuration
    ProgramFspConfigurationRepository,
  ],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}

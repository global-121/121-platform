import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProjectEntity, ProjectFspConfigurationEntity]),
    // TODO: Refactor this to not make excel module depedenent TransactionsModule and RegistrationsModule
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    LookupService,
    FileImportService,
    // TODO: Refactor this to not make excel module depedenent on project Fsp configuration
    ProjectFspConfigurationRepository,
  ],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}

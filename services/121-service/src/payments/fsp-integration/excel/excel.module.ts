import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramFinancialServiceProviderConfigurationEntity,
    ]),
    // TODO: Refactor this to not make excel module depedenent TransactionsModule and RegistrationsModule
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    LookupService,
    FileImportService,
    // TODO: Refactor this to not make excel module depedenent on program financial service provider configuration
    ProgramFinancialServiceProviderConfigurationRepository,
  ],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}

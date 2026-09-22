import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExcelFspConfigurationEntity } from '@121-service/src/fsp-integrations/integrations/excel/entities/excel-fsp-configuration.entity';
import { ExcelService } from '@121-service/src/fsp-integrations/integrations/excel/excel.service';
import { ExcelFspConfigurationController } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.controller';
import { ExcelFspConfigurationRepository } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.repository';
import { ExcelFspConfigurationService } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.service';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { PaymentsProgressModule } from '@121-service/src/payments/payments-progress.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramRegistrationAttributesModule } from '@121-service/src/program-registration-attributes/program-registration-attributes.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ExcelFspConfigurationEntity,
      ProgramEntity,
      ProgramFspConfigurationEntity,
    ]),
    ProgramFspConfigurationsModule,
    ProgramRegistrationAttributesModule,
    PaymentsProgressModule,
    // TODO: Refactor this to not make excel module dependent TransactionsModule and RegistrationsModule
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    ExcelFspConfigurationRepository,
    ExcelFspConfigurationService,
    LookupService,
    FileImportService,
  ],
  controllers: [ExcelFspConfigurationController],
  exports: [ExcelFspConfigurationRepository, ExcelService],
})
export class ExcelModule {}

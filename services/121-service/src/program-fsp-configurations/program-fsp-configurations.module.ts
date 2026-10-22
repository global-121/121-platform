import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsProgressModule } from '@121-service/src/payments/payments-progress.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ExcelFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/excel/entities/excel-fsp-configuration.entity';
import { ExcelFspConfigurationController } from '@121-service/src/program-fsp-configurations/excel/excel-fsp-configuration.controller';
import { ExcelFspConfigurationService } from '@121-service/src/program-fsp-configurations/excel/excel-fsp-configuration.service';
import { ExcelFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/excel/repositories/excel-fsp-configuration.repository';
import { ProgramFspConfigurationsController } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.controller';
import { ProgramFspConfigurationsHelperService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.helper';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';
import { ProgramRegistrationAttributesModule } from '@121-service/src/program-registration-attributes/program-registration-attributes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExcelFspConfigurationEntity,
      ProgramFspConfigurationEntity,
      ProgramFspConfigurationPropertyEntity,
    ]),
    ProgramRegistrationAttributesModule,
    PaymentsProgressModule,
  ],
  providers: [
    ProgramFspConfigurationsService,
    ProgramFspConfigurationRepository,
    ProgramFspConfigurationsHelperService,
    ExcelFspConfigurationRepository,
    ExcelFspConfigurationService,
  ],
  controllers: [
    ProgramFspConfigurationsController,
    ExcelFspConfigurationController,
  ],
  exports: [
    ProgramFspConfigurationRepository,
    ProgramFspConfigurationsService,
    ExcelFspConfigurationRepository,
  ],
})
export class ProgramFspConfigurationsModule {}

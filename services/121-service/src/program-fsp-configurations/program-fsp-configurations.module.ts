import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationsController } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.controller';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramFspConfigurationEntity,
      ProgramFspConfigurationPropertyEntity,
    ]),
  ],
  providers: [
    ProgramFinancialServiceProviderConfigurationsService,
    ProgramFinancialServiceProviderConfigurationRepository,
  ],
  controllers: [ProgramFinancialServiceProviderConfigurationsController],
  exports: [
    ProgramFinancialServiceProviderConfigurationRepository,
    ProgramFinancialServiceProviderConfigurationsService,
  ],
})
export class ProgramFinancialServiceProviderConfigurationsModule {}

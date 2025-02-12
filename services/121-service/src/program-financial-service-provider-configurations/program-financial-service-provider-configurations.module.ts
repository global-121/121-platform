import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/project-financial-service-provider-configuration.entity';
import { ProjectFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/project-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationsController } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.controller';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectFinancialServiceProviderConfigurationEntity,
      ProjectFinancialServiceProviderConfigurationPropertyEntity,
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

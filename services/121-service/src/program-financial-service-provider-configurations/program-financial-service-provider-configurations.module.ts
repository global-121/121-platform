import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationsController } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.controller';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramFinancialServiceProviderConfigurationEntity,
      ProgramFinancialServiceProviderConfigurationPropertyEntity,
      ProgramRegistrationAttributeEntity, // TODO: decide if this is right place for this import
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

// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProvidersModule } from '@121-service/src/financial-service-providers/financial-service-provider.module';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramFspConfigurationController } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.controller';
import { ProgramFinancialServiceProviderConfigurationsRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramFinancialServiceProviderConfigurationEntity,
      // TODO: This is needed because the repository thats used to get FSPs is the typeorm variant, not our custom one.
      FinancialServiceProviderEntity,
    ]),
    // TODO: REFACTOR: This configuration module shouldn't depend on the FinancialServiceProviderModule. Try to refactor this out in the displayName item.
    FinancialServiceProvidersModule,
  ],
  providers: [
    ProgramFinancialServiceProviderConfigurationsService,
    ProgramFinancialServiceProviderConfigurationsRepository,
  ],
  controllers: [ProgramFspConfigurationController],
  exports: [
    ProgramFinancialServiceProviderConfigurationsRepository,
    ProgramFinancialServiceProviderConfigurationsService,
  ],
})
export class ProgramFinancialServiceProviderConfigurationsModule {}

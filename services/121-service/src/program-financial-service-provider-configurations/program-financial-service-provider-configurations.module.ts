// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationsController } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.controller';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';

@Module({
  // This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not depend on any other 121 Service Modules.
  imports: [
    TypeOrmModule.forFeature([
      ProgramFinancialServiceProviderConfigurationEntity,
      ProgramFinancialServiceProviderConfigurationPropertyEntity,
    ]),
    TransactionsModule,
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

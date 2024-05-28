// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [ProgramFinancialServiceProviderConfigurationsService],
})
export class ProgramFinancialServiceProviderConfigurationsModule {}

// This Module is a "leaf" module at the "outside" of the 121 Service Modules dependency tree. It should not deoend on any other 121 Service Modules.
import { Module } from '@nestjs/common';
import { ProgramFinancialServiceProviderConfigurationsService } from './program-financial-service-provider-configurations.service';

@Module({
  providers: [ProgramFinancialServiceProviderConfigurationsService],
})
export class ProgramFinancialServiceProviderConfigurationsModule {}

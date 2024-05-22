import { Module } from '@nestjs/common';
import { ProgramFinancialServiceProviderConfigurationsService } from './program-financial-service-provider-configurations.service';

@Module({
  providers: [ProgramFinancialServiceProviderConfigurationsService],
})
export class ProgramFinancialServiceProviderConfigurationsModule {}

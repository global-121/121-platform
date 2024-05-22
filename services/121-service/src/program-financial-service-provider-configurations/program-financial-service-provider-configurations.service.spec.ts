import { Test, TestingModule } from '@nestjs/testing';
import { ProgramFinancialServiceProviderConfigurationsService } from './program-financial-service-provider-configurations.service';

describe('ProgramFinancialServiceProviderConfigurationsService', () => {
  let service: ProgramFinancialServiceProviderConfigurationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramFinancialServiceProviderConfigurationsService],
    }).compile();

    service = module.get<ProgramFinancialServiceProviderConfigurationsService>(ProgramFinancialServiceProviderConfigurationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

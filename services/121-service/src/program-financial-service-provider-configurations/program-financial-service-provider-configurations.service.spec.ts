import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('ProgramFinancialServiceProviderConfigurationsService', () => {
  let service: ProgramFinancialServiceProviderConfigurationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramFinancialServiceProviderConfigurationsService],
    }).compile();

    service = module.get<ProgramFinancialServiceProviderConfigurationsService>(
      ProgramFinancialServiceProviderConfigurationsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

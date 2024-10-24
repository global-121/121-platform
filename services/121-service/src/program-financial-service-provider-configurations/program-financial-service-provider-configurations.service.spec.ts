import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';

describe('ProgramFinancialServiceProviderConfigurationsService', () => {
  let service: ProgramFinancialServiceProviderConfigurationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramFinancialServiceProviderConfigurationsService,
        {
          provide: getRepositoryToken(
            ProgramFinancialServiceProviderConfigurationEntity,
          ),
          useValue: {}, // provide a mock implementation if needed
        },
      ],
    }).compile();

    service = module.get<ProgramFinancialServiceProviderConfigurationsService>(
      ProgramFinancialServiceProviderConfigurationsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

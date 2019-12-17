import { Test, TestingModule } from '@nestjs/testing';
import { FundingService } from './funding.service';

describe('FundingService', () => {
  let service: FundingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FundingService],
    }).compile();

    service = module.get<FundingService>(FundingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

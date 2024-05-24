import { Test, TestingModule } from '@nestjs/testing';
import { TransferJobProcessorsService } from './transfer-job-processors.service';

describe('TransferJobProcessorsService', () => {
  let service: TransferJobProcessorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferJobProcessorsService],
    }).compile();

    service = module.get<TransferJobProcessorsService>(TransferJobProcessorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

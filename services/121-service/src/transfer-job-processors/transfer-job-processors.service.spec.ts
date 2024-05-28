import { TransferJobProcessorsService } from '@121-service/src/transfer-job-processors/transfer-job-processors.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('TransferJobProcessorsService', () => {
  let service: TransferJobProcessorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferJobProcessorsService],
    }).compile();

    service = module.get<TransferJobProcessorsService>(
      TransferJobProcessorsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

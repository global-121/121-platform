import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('TransferJobProcessorsService', () => {
  let service: TransactionJobProcessorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionJobProcessorsService],
    }).compile();

    service = module.get<TransactionJobProcessorsService>(
      TransactionJobProcessorsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

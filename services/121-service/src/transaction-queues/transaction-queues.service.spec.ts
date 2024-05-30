import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('TransferQueuesService', () => {
  let service: TransactionQueuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionQueuesService],
    }).compile();

    service = module.get<TransactionQueuesService>(TransactionQueuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

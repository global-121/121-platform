import { TransferQueuesService } from '@121-service/src/transfer-queues/transfer-queues.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('TransferQueuesService', () => {
  let service: TransferQueuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferQueuesService],
    }).compile();

    service = module.get<TransferQueuesService>(TransferQueuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

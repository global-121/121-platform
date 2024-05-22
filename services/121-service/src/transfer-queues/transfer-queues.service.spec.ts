import { Test, TestingModule } from '@nestjs/testing';
import { TransferQueuesService } from './transfer-queues.service';

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

import { Test, TestingModule } from '@nestjs/testing';
import { CreateConnectionService } from './create-connection.service';

describe('CreateConnectionService', () => {
  let service: CreateConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateConnectionService],
    }).compile();

    service = module.get<CreateConnectionService>(CreateConnectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

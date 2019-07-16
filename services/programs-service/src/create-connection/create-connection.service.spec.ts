import { Test, TestingModule } from '@nestjs/testing';
import { CreateConnectionService } from './create-connection.service';

describe('CreateConnectionService', (): void => {
  let service: CreateConnectionService;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [CreateConnectionService],
      }).compile();

      service = module.get<CreateConnectionService>(CreateConnectionService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});

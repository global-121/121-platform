import { Test, TestingModule } from '@nestjs/testing';
import { CreateConnectionService } from './create-connection.service';
import { ConnectionEntity } from './connection.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';

describe('CreateConnectionService', (): void => {
  let service: CreateConnectionService;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [CreateConnectionService,
          {
            provide: getRepositoryToken(ConnectionEntity),
            useFactory: repositoryMockFactory,
          },],
      }).compile();

      service = module.get<CreateConnectionService>(CreateConnectionService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});

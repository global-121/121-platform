import { DataStorageService } from './data-storage.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DataStorageEntity } from './data-storage.entity';
import { UserEntity } from '../user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe('User service', (): void => {
  let service: DataStorageService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DataStorageService,
          {
            provide: getRepositoryToken(DataStorageEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<DataStorageService>(DataStorageService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});

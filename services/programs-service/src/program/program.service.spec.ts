import { CustomCriterium } from './custom-criterium.entity';
import { ProgramService } from './program.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgramEntity } from './program.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe('Program service', (): void => {
  let service: ProgramService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProgramService,
          {
            provide: getRepositoryToken(ProgramEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CustomCriterium),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<ProgramService>(ProgramService);
    },
  );

  afterAll(
    async (): Promise<void> => {
      module.close();
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});

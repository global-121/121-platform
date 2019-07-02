import { CountryEntity } from './../country/country.entity';
import { CriteriumService } from './criterium.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CriteriumEntity } from './criterium.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe('Criterium service', (): void => {
  let service: CriteriumService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CriteriumService,
          {
            provide: getRepositoryToken(CriteriumEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CountryEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<CriteriumService>(CriteriumService);
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

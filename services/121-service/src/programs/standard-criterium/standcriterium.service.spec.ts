import { CountryEntity } from '../country/country.entity';
import { StandardCriteriumService } from './standard-criterium.service';
import { Test, TestingModule } from '@nestjs/testing';
import { StandardCriteriumEntity } from './standard-criterium.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { UserEntity } from '../../user/user.entity';

describe('Criterium service', (): void => {
  let service: StandardCriteriumService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StandardCriteriumService,
          {
            provide: getRepositoryToken(StandardCriteriumEntity),
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

      service = module.get<StandardCriteriumService>(StandardCriteriumService);
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

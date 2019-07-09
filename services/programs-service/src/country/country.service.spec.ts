import { CountryService } from './country.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CountryEntity } from './country.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe('Country service', (): void => {
  let service: CountryService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CountryService,
          {
            provide: getRepositoryToken(CountryEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<CountryService>(CountryService);
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

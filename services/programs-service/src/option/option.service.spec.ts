import { OptionService } from './option.service';
import { Test, TestingModule } from '@nestjs/testing';
import { OptionEntity } from './option.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { CriteriumEntity } from '../criterium/criterium.entity';

describe('Option service', (): void => {
  let service: OptionService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OptionService,
          {
            provide: getRepositoryToken(OptionEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CriteriumEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<OptionService>(OptionService);
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

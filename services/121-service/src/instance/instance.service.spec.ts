import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '../user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { InstanceService } from './instance.service';
import { InstanceEntity } from './instance.entity';
import { ProgramEntity } from '../programs/program/program.entity';

describe('Instance service', (): void => {
  let service: InstanceService;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InstanceService,
          {
            provide: getRepositoryToken(InstanceEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ProgramEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<InstanceService>(InstanceService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});

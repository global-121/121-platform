import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '../user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { ActionService } from './action.service';
import { ActionEntity } from './action.entity';
import { ProgramEntity } from '../programs/program/program.entity';

describe('Action service', (): void => {
  let service: ActionService;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ActionService,
          {
            provide: getRepositoryToken(ActionEntity),
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

      service = module.get<ActionService>(ActionService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '../user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { ActionService } from './action.service';
import { ActionEntity, ActionType } from './action.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { ActionDto } from './dto/action.dto';
import { MockType } from '../mock/mock.type';
import { Repository } from 'typeorm';

const testAction: ActionDto = {
  actionType: ActionType.notifyIncluded,
  programId: 1,
};

const actionRepositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  (): any => ({
    find: jest.fn(entity => [new ActionEntity()]),
    save: jest.fn(entity => testAction),
  }),
);

describe('Action service', (): void => {
  let service: ActionService;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ActionService,
          {
            provide: getRepositoryToken(ActionEntity),
            useFactory: actionRepositoryMockFactory,
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

  describe('getActions', (): void => {
    it('should return an array of actions', async (): Promise<void> => {
      const actions = [new ActionEntity()];

      const result = await service.getActions(
        testAction.programId,
        testAction.actionType,
      );

      expect(result).toStrictEqual(actions);
    });
  });

  describe('saveAction', (): void => {
    it('should return the saved action', async (): Promise<void> => {
      // const action = new ActionEntity();

      const result = await service.saveAction(
        1, // UserID
        testAction.programId,
        testAction.actionType,
      );

      expect(result).toStrictEqual(testAction);
    });
  });
});

import { ExportType } from './../programs/dto/export-details';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '../user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { ActionService } from './action.service';
import { ActionEntity } from './action.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ActionDto } from './dto/action.dto';
import { MockType } from '../mock/mock.type';
import { Repository } from 'typeorm';

// @ts-ignore
const testAction: ActionDto = {
  actionType: ExportType.included,
  programId: 1,
};

const actionRepositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  (): any => ({
    findOne: jest.fn(entity => new ActionEntity()),
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

  describe('getLatestActions', (): void => {
    it('should return an action', async (): Promise<void> => {
      const action = new ActionEntity();

      const result = await service.getLatestActions(
        testAction.programId,
        testAction.actionType,
      );

      expect(result).toStrictEqual(action);
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

import { ActionDto } from './dto/action.dto';
import { Test } from '@nestjs/testing';
import { ActionController } from './action.controller';
import { ActionService } from './action.service';
import { ActionEntity, ActionType } from './action.entity';
import { RolesGuard } from '../roles.guard';

const testAction: ActionDto = {
  actionType: ActionType.notifyIncluded,
  programId: 1,
};

class ActionServiceMock {
  public async getActions(
    programId: number,
    actionType: ActionType,
  ): Promise<ActionEntity[]> {
    programId;
    actionType;
    return [new ActionEntity()];
  }

  public async saveAction(
    programId: number,
    actionType: ActionType,
  ): Promise<ActionEntity> {
    programId;
    actionType;
    return new ActionEntity();
  }
}

describe('ActionController', (): void => {
  let actionController: ActionController;
  let actionService: ActionService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [ActionController],
        providers: [
          {
            provide: ActionService,
            useValue: new ActionServiceMock(),
          },
        ],
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

      actionService = module.get<ActionService>(ActionService);
      actionController = module.get<ActionController>(ActionController);
    },
  );

  describe('getActions', (): void => {
    it('should return an array of actions', async (): Promise<void> => {
      const actions = [new ActionEntity()];

      const spy = jest
        .spyOn(actionService, 'getActions')
        .mockImplementation(
          (): Promise<ActionEntity[]> => Promise.resolve(actions),
        );

      const controllerResult = await actionController.getActions(testAction);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(actions);
    });
  });

  describe('saveAction', (): void => {
    it('should return the saved action', async (): Promise<void> => {
      const action = new ActionEntity();

      const spy = jest
        .spyOn(actionService, 'saveAction')
        .mockImplementation(
          (): Promise<ActionEntity> => Promise.resolve(action),
        );

      const controllerResult = await actionController.saveAction(1, testAction);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(action);
    });
  });
});

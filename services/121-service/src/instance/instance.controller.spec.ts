import { Test } from '@nestjs/testing';
import { InstanceController } from './instance.controller';
import { InstanceService } from './instance.service';
import { InstanceEntity } from './instance.entity';
import { RolesGuard } from '../roles.guard';

class InstanceServiceMock {
  public async getInstances(): Promise<InstanceEntity> {
    return new InstanceEntity();
  }
}

describe('InstanceController', (): void => {
  let instanceController: InstanceController;
  let instanceService: InstanceService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [InstanceController],
        providers: [
          {
            provide: InstanceService,
            useValue: new InstanceServiceMock(),
          },
        ],
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

      instanceService = module.get<InstanceService>(InstanceService);
      instanceController = module.get<InstanceController>(InstanceController);
    },
  );

  describe('getInstance', (): void => {
    it('should return an instance', async (): Promise<void> => {
      const instance = new InstanceEntity();

      const spy = jest
        .spyOn(instanceService, 'getInstance')
        .mockImplementation(
          (): Promise<InstanceEntity> => Promise.resolve(instance),
        );

      const controllerResult = await instanceController.getInstance();
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(instance);
    });
  });
});

import { Test } from '@nestjs/testing';
import { CriteriumController } from './criterium.controller';
import { CriteriumService } from './criterium.service';
import { CriteriumEntity } from './criterium.entity';

class CriteriumServiceMock {
  public async findAll(): Promise<CriteriumEntity[]> {
    return [new CriteriumEntity()];
  }
  public async find(): Promise<CriteriumEntity[]> {
    return [new CriteriumEntity()];
  }
  public async create(): Promise<CriteriumEntity> {
    return new CriteriumEntity();
  }
}

describe('CriteriumController', (): void => {
  let criteriumController: CriteriumController;
  let criteriumService: CriteriumService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [CriteriumController],
        providers: [
          {
            provide: CriteriumService,
            useValue: new CriteriumServiceMock(),
          },
        ],
      }).compile();

      criteriumService = module.get<CriteriumService>(CriteriumService);
      criteriumController = module.get<CriteriumController>(
        CriteriumController,
      );
    },
  );

  describe('findAll', (): void => {
    it('should return an array of criteriums', async (): Promise<void> => {
      const criterium = new CriteriumEntity();
      const criteriumsAll: [CriteriumEntity] = [criterium];
      const spy = jest
        .spyOn(criteriumService, 'findAll')
        .mockImplementation(
          (): Promise<CriteriumEntity[]> => Promise.resolve(criteriumsAll),
        );

      const controllerResult = await criteriumController.findAll();
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(criteriumsAll);
    });
  });

  describe('find', (): void => {
    it('should return a criterium based on a country id', async (): Promise<
      void
    > => {
      const criterium = [new CriteriumEntity()];
      const spy = jest
        .spyOn(criteriumService, 'find')
        .mockImplementation(
          (): Promise<CriteriumEntity[]> => Promise.resolve(criterium),
        );

      const controllerResult = await criteriumController.find(1);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(criterium);
    });
  });

  describe('create', (): void => {
    it('should create instance of criterium ', async (): Promise<void> => {
      const criterium = new CriteriumEntity();
      const spy = jest
        .spyOn(criteriumService, 'create')
        .mockImplementation(
          (): Promise<CriteriumEntity> => Promise.resolve(criterium),
        );

      const newCritetiumParameters = {
        criterium: 'test',
        answerType: 'dropdown',
        criteriumType: 'standard',
      };

      const controllerResult = await criteriumController.create(
        1,
        newCritetiumParameters,
      );
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toBe(criterium);
    });
  });
});

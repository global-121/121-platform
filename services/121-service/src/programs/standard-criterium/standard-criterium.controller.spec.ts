import { Test } from '@nestjs/testing';
import { StandardCriteriumController } from './standard-criterium.controller';
import { StandardCriteriumService } from './standard-criterium.service';
import { StandardCriteriumEntity } from './standard-criterium.entity';
import { RolesGuard } from '../../roles.guard';

const newStandardCriteriumParameters = {
  criterium: 'test',
  answerType: 'numeric',
  criteriumType: 'standard',
  options: JSON.parse('{}'),
  question: JSON.parse('{}'),
};

class StandardCriteriumServiceMock {
  public async findAll(): Promise<StandardCriteriumEntity[]> {
    return [new StandardCriteriumEntity()];
  }
  public async find(): Promise<StandardCriteriumEntity[]> {
    return [new StandardCriteriumEntity()];
  }
  public async create(): Promise<StandardCriteriumEntity> {
    return new StandardCriteriumEntity();
  }
}

describe('CriteriumController', (): void => {
  let criteriumController: StandardCriteriumController;
  let criteriumService: StandardCriteriumService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [StandardCriteriumController],
        providers: [
          {
            provide: StandardCriteriumService,
            useValue: new StandardCriteriumServiceMock(),
          },
        ],
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

      criteriumService = module.get<StandardCriteriumService>(
        StandardCriteriumService,
      );
      criteriumController = module.get<StandardCriteriumController>(
        StandardCriteriumController,
      );
    },
  );

  describe('findAll', (): void => {
    it('should return an array of criteriums', async (): Promise<void> => {
      const criterium = new StandardCriteriumEntity();
      const criteriumsAll: [StandardCriteriumEntity] = [criterium];
      const spy = jest
        .spyOn(criteriumService, 'findAll')
        .mockImplementation(
          (): Promise<StandardCriteriumEntity[]> =>
            Promise.resolve(criteriumsAll),
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
      const criterium = [new StandardCriteriumEntity()];
      const spy = jest
        .spyOn(criteriumService, 'find')
        .mockImplementation(
          (): Promise<StandardCriteriumEntity[]> => Promise.resolve(criterium),
        );

      const controllerResult = await criteriumController.find(1);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(criterium);
    });
  });

  describe('create', (): void => {
    it('should create instance of criterium ', async (): Promise<void> => {
      const criterium = new StandardCriteriumEntity();
      const spy = jest
        .spyOn(criteriumService, 'create')
        .mockImplementation(
          (): Promise<StandardCriteriumEntity> => Promise.resolve(criterium),
        );

      const controllerResult = await criteriumController.create(
        1,
        newStandardCriteriumParameters,
      );
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toBe(criterium);
    });
  });
});

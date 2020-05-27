import { Test } from '@nestjs/testing';
import { DataStorageController } from './data-storage.controller';
import { DataStorageService } from './data-storage.service';
import { DataStorageEntity } from './data-storage.entity';
import { StoreDataDto } from './dto';
import { RolesGuard } from '../roles.guard';

const data = 'string';
const testDataStorage = {
  id: 1,
  userId: 1,
  type: 'string',
  data: 'string',
  created: new Date(Date.UTC(2017, 1, 14)),
};

class DataStorageServiceMock {
  public async get(): Promise<string> {
    return data;
  }
  public async post(storeData: StoreDataDto): Promise<DataStorageEntity> {
    const testDataStorage = {
      id: 1,
      userId: 1,
      type: storeData.type,
      data: storeData.data,
      created: new Date(Date.UTC(2017, 1, 14)),
    };
    return testDataStorage;
  }
}

describe('UserController', (): void => {
  let dataStorageController: DataStorageController;
  let dataStorageService: DataStorageService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [DataStorageController],
        providers: [
          {
            provide: DataStorageService,
            useValue: new DataStorageServiceMock(),
          },
        ],
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();
      dataStorageService = module.get<DataStorageService>(DataStorageService);
      dataStorageController = module.get<DataStorageController>(
        DataStorageController,
      );
    },
  );

  describe('get', (): void => {
    it('should return data', async (): Promise<void> => {
      const getDataParameters = {
        type: 'string',
      };
      const spy = jest
        .spyOn(dataStorageService, 'get')
        .mockImplementation(
          (): Promise<any> => Promise.resolve(testDataStorage),
        );
      const controllerResult = await dataStorageController.get(
        1,
        getDataParameters,
      );

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(testDataStorage);
    });
  });

  describe('post', (): void => {
    xit('should return data', async (): Promise<void> => {
      const storeDataParameters = {
        type: 'string',
        data: 'string',
      };
      const controllerResult = await dataStorageController.post(
        1,
        storeDataParameters,
      );

      expect(controllerResult).toStrictEqual(testDataStorage);

      const spy = jest
        .spyOn(dataStorageService, 'post')
        .mockImplementation(
          (): Promise<DataStorageEntity> =>
            Promise.resolve(new DataStorageEntity()),
        );
      await dataStorageController.post(1, storeDataParameters);
      expect(spy).toHaveBeenCalled();
    });
  });
});

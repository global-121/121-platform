import { CountryEntity } from './country.entity';
import { Test } from '@nestjs/testing';
import { CountryController } from './country.controller';
import { CountryService } from './country.service';
import { RolesGuard } from '../../roles.guard';

class CountryServiceMock {
  public async findAll(): Promise<CountryEntity[]> {
    return [];
  }
}

describe('CountryController', (): void => {
  let countryController: CountryController;
  let countryService: CountryService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [CountryController],
        providers: [
          {
            provide: CountryService,
            useValue: new CountryServiceMock(),
          },
        ],
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

      countryService = module.get<CountryService>(CountryService);
      countryController = module.get<CountryController>(CountryController);
    },
  );

  describe('findAll', (): void => {
    it('should return an array of countrys', async (): Promise<void> => {
      const initialInput = [
        {
          id: 3,
          country: 'bla',
          criteriumIds: [1, 2],
        },
      ];
      const clone = [];
      initialInput.map(val => clone.push(Object.assign({}, val)));
      jest
        .spyOn(countryService, 'findAll')
        .mockImplementation(
          (): Promise<CountryEntity[]> => Promise.resolve(initialInput),
        );

      const controllerResult = await countryController.findAll();
      expect(controllerResult).toStrictEqual(clone);
    });
  });
});

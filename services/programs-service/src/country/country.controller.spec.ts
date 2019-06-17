import { Test } from '@nestjs/testing';
import 'jest';

import { CountryController } from './country.controller';
import { CountryService } from './country.service';

class CountryServiceMock  {
  async findAll(): Promise<any> {
      return [];
  }
}

describe('CountryController', () => {
  let countryController: CountryController;
  let countryService: CountryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CountryController],
      providers: [{
        provide: CountryService,
        useValue: new CountryServiceMock()
      }],
    }).compile();

    countryService = module.get<CountryService>(CountryService);
    countryController = module.get<CountryController>(CountryController);
  });

  describe('findAll', () => {
    it('should return an array of countrys', async () => {
      const initialInput = [
        {
          id: 3,
          country: 'bla',
          criteriumIds: [1,2]
        },
      ];
      const clone = [];
      initialInput.map(val => clone.push(Object.assign({}, val)));
      jest.spyOn(countryService, 'findAll').mockImplementation(() => Promise.resolve(initialInput));

      const controllerResult = await countryController.findAll();
      expect(controllerResult).toStrictEqual(clone);
    });
  });

});

import { CountryController } from './country.controller';
import { Test } from '@nestjs/testing';
import 'jest';
import {TypeOrmModule} from "@nestjs/typeorm";
import { CountryService } from './country.service';
import { CountryEntity } from './country.entity';


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
      const result = [
        {
          id: 2,
          country: 'bla',
          criteriumIds: [1,2]
        },
      ];
      jest.spyOn(countryService, 'findAll').mockImplementation(() => Promise.resolve(result));
      expect(await countryController.findAll()).toBe(result);
    });
  });
});

import { CriteriumController } from './criterium.controller';
import { Test } from '@nestjs/testing';
import 'jest';
import {TypeOrmModule} from "@nestjs/typeorm";
import { CriteriumService } from './criterium.service';
import { CriteriumEntity } from './criterium.entity';


class CriteriumServiceMock  {
  async findAll(): Promise<any> {
      return [];
  }
}

describe('CriteriumController', () => {
  let criteriumController: CriteriumController;
  let criteriumService: CriteriumService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CriteriumController],
      providers: [{
        provide: CriteriumService,
        useValue: new CriteriumServiceMock()
      }],
    }).compile();

    criteriumService = module.get<CriteriumService>(CriteriumService);
    criteriumController = module.get<CriteriumController>(CriteriumController);
  });

  describe('findAll', () => {
    it('should return an array of criteriums', async () => {
      const result = [
        {
          id: 2,
          criterium: 'bla',
          answerType: 'bla'
        },
      ];
      jest.spyOn(criteriumService, 'findAll').mockImplementation(() => Promise.resolve(result));
      expect(await criteriumController.findAll()).toBe(result);
    });
  });
});

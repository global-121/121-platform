import { Test } from '@nestjs/testing';
import { OptionController } from './option.controller';
import { OptionService } from './option.service';
import { OptionEntity } from './option.entity';
import { CreateOptionDto } from './dto/create-option.dto';
import { CriteriumEntity } from '../criterium/criterium.entity';

class OptionServiceMock {
  public async findAll(): Promise<OptionEntity[]> {
    return [new OptionEntity()];
  }
  public async create(
    criteriumId: number,
    optionData: CreateOptionDto,
  ): Promise<OptionEntity> {
    const option = new OptionEntity();
    option.id = 1;
    option.option = optionData.option;
    option.criterium = new CriteriumEntity();
    return option;
  }
}

describe('OptionController', (): void => {
  let optionController: OptionController;
  let optionService: OptionService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [OptionController],
        providers: [
          {
            provide: OptionService,
            useValue: new OptionServiceMock(),
          },
        ],
      }).compile();
      optionService = module.get<OptionService>(OptionService);
      optionController = module.get<OptionController>(OptionController);
    },
  );

  describe('findAll', (): void => {
    it('should return an array of options', async (): Promise<void> => {
      const option = new OptionEntity();
      const optionsAll = [option];
      const spy = jest
        .spyOn(optionService, 'findAll')
        .mockImplementation(
          (): Promise<OptionEntity[]> => Promise.resolve(optionsAll),
        );
      const controllerResult = await optionController.findAll();
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(optionsAll);
    });
  });
  describe('create', (): void => {
    it('should return an a option entity', async (): Promise<void> => {
      const option = new OptionEntity();
      const optionValue = {
        option: 'test',
      };
      const spy = jest
        .spyOn(optionService, 'create')
        .mockImplementation(
          (): Promise<OptionEntity> => Promise.resolve(option),
        );

      const controllerResult = await optionController.create(1, optionValue);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toEqual(option);
    });
  });
});

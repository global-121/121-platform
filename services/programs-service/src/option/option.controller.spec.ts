import { Test } from "@nestjs/testing";
import "jest";

import { OptionController } from "./option.controller";
import { OptionService } from "./option.service";
import { OptionEntity } from "./option.entity";
import { OptionsRO } from "./option.interface";
import { CreateOptionDto } from "./dto/create-option.dto";
import { CriteriumEntity } from "../criterium/criterium.entity";

class OptionServiceMock {
  async findAll(): Promise<OptionEntity[]>{
    console.log("balbal")
    return [new OptionEntity()];
  }
  async create(criteriumId: number, optionData: CreateOptionDto): Promise<OptionEntity>{
    const option = new OptionEntity();
    option.id = 1;
    option.option = "bla"//optionData.option;
    option.criterium = new CriteriumEntity();
    console.log(option.option)
    console.log("hier hier")
    return option;
  }
}

describe("OptionController", () => {
  let optionController: OptionController;
  let optionService: OptionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OptionController],
      providers: [
        {
          provide: OptionService,
          useValue: new OptionServiceMock()
        }
      ]
    }).compile();
    optionService = module.get<OptionService>(OptionService);
    optionController = module.get<OptionController>(OptionController);
  });

  describe("findAll", () => {
    it("should return an array of options", async () => {
      const option = new OptionEntity();
      const optionsAll = [option]
      const spy = jest
        .spyOn(optionService, "findAll")
        .mockImplementation(() => Promise.resolve(optionsAll));

      const controllerResult = await optionController.findAll();
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(optionsAll);
    });
  });
  describe("create", () => {
    it("should return an a option entity", async () => {
      const option = new OptionEntity();
      const optionValue = {
        "option": "test"
      }
      const spy = jest
        .spyOn(optionService, "create")
        .mockImplementation(() => Promise.resolve(option));

      const controllerResult = await optionController.create(1, optionValue);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toEqual(option);
    });
  });
});

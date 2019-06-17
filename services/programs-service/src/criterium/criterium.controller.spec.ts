import { Test } from "@nestjs/testing";
import "jest";

import { CriteriumController } from "./criterium.controller";
import { CriteriumService } from "./criterium.service";
import { CriteriumEntity } from "./criterium.entity";

class CriteriumServiceMock {
  async findAll(): Promise<CriteriumEntity[]> {
    return [new CriteriumEntity];
  }
  async find(): Promise<CriteriumEntity[]> {
    return [new CriteriumEntity];
  }
  async create(): Promise<CriteriumEntity> {
    return new CriteriumEntity;
  }
}

describe("CriteriumController", () => {
  let criteriumController: CriteriumController;
  let criteriumService: CriteriumService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CriteriumController],
      providers: [
        {
          provide: CriteriumService,
          useValue: new CriteriumServiceMock()
        }
      ]
    }).compile();

    criteriumService = module.get<CriteriumService>(CriteriumService);
    criteriumController = module.get<CriteriumController>(CriteriumController);
  });

  describe("findAll", () => {
    it("should return an array of criteriums", async () => {
      const criterium = new CriteriumEntity();
      const criteriumsAll: [CriteriumEntity] = [criterium];
      jest
        .spyOn(criteriumService, "findAll")
        .mockImplementation(() => Promise.resolve(criteriumsAll));

      const controllerResult = await criteriumController.findAll();
      expect(controllerResult).toStrictEqual(criteriumsAll);
    });
  });

    describe("find", () => {
      it("should return a criterium based on a country id", async () => {
        const criterium = [new CriteriumEntity()];
        jest
          .spyOn(criteriumService, "find")
          .mockImplementation(() => Promise.resolve(criterium));

        const controllerResult = await criteriumController.find(1);
        expect(controllerResult).toStrictEqual(criterium);
      });
  });

  describe("create", () => {
    it("should create instance of criterium ", async () => {
      const criterium = new CriteriumEntity();
      jest
        .spyOn(criteriumService, "create")
        .mockImplementation(() => Promise.resolve(criterium));

      const newCritetiumParameters = {
        criterium: "test",
        answerType: "dropdown",
        criteriumType: "standard"
      }

      const controllerResult = await criteriumController.create(1, newCritetiumParameters);
      expect(controllerResult).toBe(criterium);
    });
});
});


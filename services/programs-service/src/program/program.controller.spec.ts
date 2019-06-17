import { Test } from "@nestjs/testing";
import "jest";

import { ProgramController } from "./program.controller";
import { ProgramService } from "./program.service";
import { ProgramEntity } from "./program.entity";
import { ProgramsRO } from "./program.interface";

class ProgramServiceMock {
  async findAll(): Promise<any> {
    return {};
  }
}

describe("ProgramController", () => {
  let programController: ProgramController;
  let programService: ProgramService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProgramController],
      providers: [
        {
          provide: ProgramService,
          useValue: new ProgramServiceMock()
        }
      ]
    }).compile();

    programService = module.get<ProgramService>(ProgramService);
    programController = module.get<ProgramController>(ProgramController);
  });

  describe("findAll", () => {
    it("should return an object with a count and and array of programs", async () => {
      const program = new ProgramEntity();
      const programsAll: ProgramsRO = {
        programs: [program],
        programsCount: 1
      };
      jest
        .spyOn(programService, "findAll")
        .mockImplementation(() => Promise.resolve(programsAll));

      const controllerResult = await programController.findAll(["bla"]);
      expect(controllerResult).toStrictEqual(programsAll);
    });
  });
});

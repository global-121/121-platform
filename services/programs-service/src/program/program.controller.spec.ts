import { CreateProgramDto } from './dto/create-program.dto';
import { Test } from "@nestjs/testing";
import "jest";

import { ProgramController } from "./program.controller";
import { ProgramService } from "./program.service";
import { ProgramEntity } from "./program.entity";
import { ProgramRO, ProgramsRO } from "./program.interface";
import { UserEntity } from '../user/user.entity';

class ProgramServiceMock {
  async findAll(query): Promise<ProgramsRO>  {
    return {programs: [new ProgramEntity()], programsCount: 1};
  }
  async create(userId: number, programData: CreateProgramDto): Promise<ProgramEntity> {
    return new ProgramEntity();
  }
  async update(id: number, programData: any): Promise<ProgramRO> {
    return {program: new ProgramEntity()};
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
  describe("create", () => {
    it("should create a program and then return that program", async () => {
      const program = new ProgramEntity();
      jest
        .spyOn(programService, "create")
        .mockImplementation(() => Promise.resolve(program));

        const newProgramParameters =   {
          "title": "string",
          "description": "string",
          "countryId": 1
        }

      const controllerResult = await programController.create(0, newProgramParameters);
      expect(controllerResult).toStrictEqual(program);
    });
  });

  describe("update", () => {
    it("should update a program and then return that program", async () => {
      const programRO = {
        program: new ProgramEntity()
      }
      jest
        .spyOn(programService, "update")
        .mockImplementation(() => Promise.resolve(programRO));

        const newProgramParameters =   {
          "title": "string",
          "description": "string",
          "countryId": 1
        }

      const controllerResult = await programController.update(0, 0, newProgramParameters);
      expect(controllerResult).toStrictEqual(programRO);
    });
  });
});

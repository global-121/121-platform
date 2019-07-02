import { CreateProgramDto } from './dto/create-program.dto';
import { Test } from '@nestjs/testing';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';
import { ProgramEntity } from './program.entity';
import { ProgramRO, ProgramsRO } from './program.interface';
import { UserEntity } from '../user/user.entity';

class ProgramServiceMock {
  public async findAll(query): Promise<ProgramsRO> {
    query;
    return { programs: [new ProgramEntity()], programsCount: 1 };
  }
  public async create(
    userId: number,
    programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    userId;
    programData;
    return new ProgramEntity();
  }
  public async update(id: number, programData: any): Promise<ProgramRO> {
    id;
    programData;
    return { program: new ProgramEntity() };
  }
}

describe('ProgramController', (): void => {
  let programController: ProgramController;
  let programService: ProgramService;

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [ProgramController],
        providers: [
          {
            provide: ProgramService,
            useValue: new ProgramServiceMock(),
          },
        ],
      }).compile();

      programService = module.get<ProgramService>(ProgramService);
      programController = module.get<ProgramController>(ProgramController);
    },
  );

  describe('findAll', (): void => {
    it('should return an object with a count and and array of programs', async (): Promise<
      void
    > => {
      const program = new ProgramEntity();
      const programsAll: ProgramsRO = {
        programs: [program],
        programsCount: 1,
      };
      const spy = jest
        .spyOn(programService, 'findAll')
        .mockImplementation(
          (): Promise<ProgramsRO> => Promise.resolve(programsAll),
        );

      const controllerResult = await programController.findAll(['']);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(programsAll);
    });
  });
  describe('create', (): void => {
    it('should create a program and then return that program', async (): Promise<
      void
    > => {
      const program = new ProgramEntity();
      const spy = jest
        .spyOn(programService, 'create')
        .mockImplementation(
          (): Promise<ProgramEntity> => Promise.resolve(program),
        );

      const newProgramParameters = {
        title: 'string',
        description: 'string',
        countryId: 1,
      };

      const controllerResult = await programController.create(
        0,
        newProgramParameters,
      );
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(program);
    });
  });

  describe('update', (): void => {
    it('should update a program and then return that program', async (): Promise<
      void
    > => {
      const programRO = {
        program: new ProgramEntity(),
      };
      const spy = jest
        .spyOn(programService, 'update')
        .mockImplementation(
          (): Promise<ProgramRO> => Promise.resolve(programRO),
        );

      const newProgramParameters = {
        title: 'string',
        description: 'string',
        countryId: 1,
      };

      const controllerResult = await programController.update(
        0,
        0,
        newProgramParameters,
      );
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(programRO);
    });
  });
});

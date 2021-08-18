import { CreateProgramDto } from './dto/create-program.dto';
import { Test } from '@nestjs/testing';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';
import { ProgramEntity } from './program.entity';
import { ProgramRO, ProgramsRO, SimpleProgramRO } from './program.interface';
import { RolesGuard } from '../../roles.guard';
import { ProgramPhase } from '../../models/program-phase.model';

const newProgramParameters = {
  location: 'Lilongwe',
  ngo: 'Dorcas',
  title: JSON.parse('{"en": "pilot_program_1a"}'),
  description: JSON.parse(
    '{"en": "Program to help people hit by earthquake examplename"}',
  ),
  descLocation: JSON.parse('{"en": "Specification of location"}'),
  descHumanitarianObjective: JSON.parse('{"en": "Specification of hum. obj."}'),
  descCashType: JSON.parse(
    '{"en": "Specification of cash type: Unconditional multi-purpose"}',
  ),
  startDate: new Date(),
  endDate: new Date(),
  currency: 'MWK',
  distributionFrequency: 'month',
  distributionDuration: 3,
  fixedTransferValue: JSON.parse('[500, 500, 500]'),
  financialServiceProviders: JSON.parse('{}'),
  inclusionCalculationType: 'highestScoresX', // Only option for now later, it can also be a fancy algorithm
  minimumScore: 0,
  highestScoresX: 500,
  meetingDocuments: JSON.parse('{"en": "documents"}'),
  customCriteria: [],
  notifications: JSON.parse('{}'),
  phoneNumberPlaceholder: '+000 000 00 00',
  validation: true,
};

const newSimpleProgramRO = {
  id: 1,
  title: JSON.parse('{"en": "title"}'),
  phase: ProgramPhase.registrationValidation,
};

export class ProgramServiceMock {
  public async findOne(query): Promise<ProgramEntity> {
    query;
    return new ProgramEntity();
  }
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
  public async changePhase(id: number, newState: string): Promise<void> {
    id;
    newState;
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
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

      programService = module.get<ProgramService>(ProgramService);
      programController = module.get<ProgramController>(ProgramController);
    },
  );

  describe('findOne', (): void => {
    it('should return an object with a count and and array of programs', async (): Promise<
      void
    > => {
      const program = new ProgramEntity();

      const spy = jest
        .spyOn(programService, 'findOne')
        .mockImplementation(
          (): Promise<ProgramEntity> => Promise.resolve(program),
        );

      const controllerResult = await programController.findOne(['']);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(program);
    });
  });

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

      const controllerResult = await programController.findAll();
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

      const controllerResult = await programController.create(
        0,
        newProgramParameters,
      );
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(program);
    });
  });

  describe('publish', (): void => {
    it('should publish a program', async (): Promise<void> => {
      const spy = jest
        .spyOn(programService, 'changePhase')
        .mockImplementation(
          (): Promise<SimpleProgramRO> => Promise.resolve(newSimpleProgramRO),
        );

      await programController.changePhase(1, {
        newState: ProgramPhase.registrationValidation,
      });
      expect(spy).toHaveBeenCalled();
    });
  });
  describe('unpublish', (): void => {
    it('should publish a program', async (): Promise<void> => {
      const spy = jest
        .spyOn(programService, 'changePhase')
        .mockImplementation(
          (): Promise<SimpleProgramRO> => Promise.resolve(newSimpleProgramRO),
        );

      await programController.changePhase(1, { newState: ProgramPhase.design });
      expect(spy).toHaveBeenCalled();
    });
  });
});

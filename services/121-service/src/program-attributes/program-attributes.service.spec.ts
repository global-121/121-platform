/* eslint-disable @typescript-eslint/ban-types */
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { QuestionType } from '@121-service/src/registration/enum/custom-data-attributes';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/createQueryBuilderMock.helper';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('ProgramAttributesService', () => {
  let programAttributesService: ProgramAttributesService;
  let programCustomAttributeRepository: Repository<ProgramCustomAttributeEntity>;

  const programCustomAttributeRepositoryToken: string | Function =
    getRepositoryToken(ProgramCustomAttributeEntity);
  const programRepositoryToken: string | Function =
    getRepositoryToken(ProgramEntity);
  const programQuestionToken: string | Function = getRepositoryToken(
    ProgramQuestionEntity,
  );
  const fspQuestionToken: string | Function =
    getRepositoryToken(FspQuestionEntity);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramAttributesService,
        {
          provide: programCustomAttributeRepositoryToken,
          useClass: Repository,
        },
        {
          provide: fspQuestionToken,
          useClass: Repository,
        },
        {
          provide: programQuestionToken,
          useClass: Repository,
        },
        {
          provide: programRepositoryToken,
          useClass: Repository,
        },
      ],
    }).compile();

    programAttributesService = module.get<ProgramAttributesService>(
      ProgramAttributesService,
    );

    programCustomAttributeRepository = module.get<
      Repository<ProgramCustomAttributeEntity>
    >(programCustomAttributeRepositoryToken);
  });

  describe('getAttributes', () => {
    it('should return only custom attributes if includeCustomAttributes === true', async () => {
      const dbQueryResult = [
        {
          name: 'test name #1',
          type: 'text',
          label: 'label for test name #1',
        },
      ];
      const createQueryBuilder: any = generateMockCreateQueryBuilder(
        dbQueryResult,
        {
          useGetMany: true,
        },
      );

      jest
        .spyOn(programCustomAttributeRepository, 'createQueryBuilder')
        .mockImplementation(() => createQueryBuilder) as any;

      const result = await programAttributesService.getAttributes(
        1,
        true,
        false,
        false,
        false,
      );

      const resultTypeMapping = result.map((r) => r.questionType);

      expect(result).toBeDefined();
      // Test the mapping
      expect(result[0].label).toBe(dbQueryResult[0].label);
      // Test the type assignment
      expect(result[0].questionType).toBe(QuestionType.programCustomAttribute);
      // Test no other types are included
      expect(resultTypeMapping).not.toContain(QuestionType.programQuestion);
      expect(resultTypeMapping).not.toContain(QuestionType.fspQuestion);
    });
  });
});

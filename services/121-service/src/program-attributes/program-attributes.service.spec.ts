/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

describe('ProgramAttributesService', () => {
  let programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;
  let programAttributesService: ProgramAttributesService;
  const programRepositoryToken: string | Function =
    getRepositoryToken(ProgramEntity);
  const programRegistrationAttributeToken: string | Function =
    getRepositoryToken(ProgramRegistrationAttributeEntity);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramAttributesService,
        {
          provide: programRegistrationAttributeToken,
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
    programRegistrationAttributeRepository = module.get<
      Repository<ProgramRegistrationAttributeEntity>
    >(programRegistrationAttributeToken);
  });

  describe('getAttributes', () => {
    it('should return only program registration attributes if includeProgramRegistrationAttributes === true and includeTemplateDefaultAttributes === false', async () => {
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
        .spyOn(programRegistrationAttributeRepository, 'createQueryBuilder')
        .mockImplementation(() => createQueryBuilder) as any;

      const result = await programAttributesService.getAttributes({
        programId: 1,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

      const includeTemplateDefaultAttributes: (keyof RegistrationViewEntity)[] =
        [
          'paymentAmountMultiplier',
          'programFspConfigurationLabel',
          'programFspConfigurationLabel',
          'paymentCountRemaining',
        ];

      const resultPropertyNames = result.map((r: any) => r.name);

      expect(result).toBeDefined();
      // Test the mapping
      expect(result[0].label).toBe(dbQueryResult[0].label);
      expect(
        resultPropertyNames.every(
          (name) =>
            !includeTemplateDefaultAttributes.map(String).includes(name),
        ),
      ).toBe(true);
    });
  });
});

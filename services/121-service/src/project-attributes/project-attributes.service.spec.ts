/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectAttributesService } from '@121-service/src/project-attributes/project-attributes.service';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

describe('ProjectAttributesService', () => {
  let projectRegistrationAttributeRepository: Repository<ProjectRegistrationAttributeEntity>;
  let projectAttributesService: ProjectAttributesService;
  const projectRepositoryToken: string | Function =
    getRepositoryToken(ProjectEntity);
  const projectRegistrationAttributeToken: string | Function =
    getRepositoryToken(ProjectRegistrationAttributeEntity);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAttributesService,
        {
          provide: projectRegistrationAttributeToken,
          useClass: Repository,
        },
        {
          provide: projectRepositoryToken,
          useClass: Repository,
        },
      ],
    }).compile();

    projectAttributesService = module.get<ProjectAttributesService>(
      ProjectAttributesService,
    );
    projectRegistrationAttributeRepository = module.get<
      Repository<ProjectRegistrationAttributeEntity>
    >(projectRegistrationAttributeToken);
  });

  describe('getAttributes', () => {
    it('should return only project registration attributes if includeProjectRegistrationAttributes === true and includeTemplateDefaultAttributes === false', async () => {
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
        .spyOn(projectRegistrationAttributeRepository, 'createQueryBuilder')
        .mockImplementation(() => createQueryBuilder) as any;

      const result = await projectAttributesService.getAttributes({
        projectId: 1,
        includeProjectRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

      const includeTemplateDefaultAttributes: (keyof RegistrationViewEntity)[] =
        [
          'paymentAmountMultiplier',
          'projectFspConfigurationLabel',
          'projectFspConfigurationLabel',
          'paymentCountRemaining',
        ];

      const resultPropertyNames = result.map((r) => r.name);

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

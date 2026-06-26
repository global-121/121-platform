import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import {
  CreateProgramRegistrationAttributeDto,
  ProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributesBatchDto,
} from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

describe('ProgramRegistrationAttributesService', () => {
  let programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;
  let programRegistrationAttributesService: ProgramRegistrationAttributesService;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- TypeORM method requires this
  const programRepositoryToken: string | Function =
    getRepositoryToken(ProgramEntity);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- TypeORM method requires this
  const programRegistrationAttributeToken: string | Function =
    getRepositoryToken(ProgramRegistrationAttributeEntity);

  const createAttributeDto = (
    overrides: Partial<CreateProgramRegistrationAttributeDto> = {},
  ): ProgramRegistrationAttributeDto => {
    return {
      name: 'defaultAttribute',
      type: RegistrationAttributeTypes.text,
      label: { en: 'Default Attribute' },
      ...overrides,
    };
  };

  const createAttributeEntity = (
    overrides: Partial<ProgramRegistrationAttributeEntity> = {},
  ): ProgramRegistrationAttributeEntity => {
    const entity = new ProgramRegistrationAttributeEntity();
    entity.id = 1;
    entity.programId = 1;
    entity.name = 'defaultAttribute';
    entity.type = RegistrationAttributeTypes.text;
    entity.label = { en: 'Default Attribute' };
    entity.options = null;
    entity.scoring = {};
    entity.pattern = null;
    entity.editableInPortal = true;
    entity.includeInTransactionExport = false;
    entity.duplicateCheck = false;
    entity.placeholder = null;
    entity.isRequired = false;
    entity.showInPeopleAffectedTable = false;
    Object.assign(entity, overrides);
    return entity;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramRegistrationAttributesService,
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

    programRegistrationAttributesService =
      module.get<ProgramRegistrationAttributesService>(
        ProgramRegistrationAttributesService,
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

      const result = await programRegistrationAttributesService.getAttributes({
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

  describe('update registration attributes', () => {
    it('should create new attribute when none exist', async () => {
      // Arrange
      const programId = 1;
      const attributes = [
        createAttributeDto({ name: 'firstName', label: { en: 'First Name' } }),
      ];

      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([]);

      const saveSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'save')
        .mockImplementation(async (entities: any) => entities);

      // Act
      await programRegistrationAttributesService.upsertProgramRegistrationAttributes(
        {
          programId,
          programRegistrationAttributes: attributes,
        },
      );

      // Assert
      const savedEntities = saveSpy.mock.calls[0][0];
      expect(savedEntities).toHaveLength(1);
      expect(savedEntities[0].name).toBe('firstName');
      expect(savedEntities[0].programId).toBe(programId);
    });

    it('should update existing attributes', async () => {
      // Arrange
      const programId = 1;
      const existingEntity = createAttributeEntity({
        id: 10,
        name: 'firstName',
        label: { en: 'Old Label' },
        isRequired: false,
      });

      const updateDto = createAttributeDto({
        name: 'firstName',
        label: { en: 'Updated First Name' },
        isRequired: true,
      });

      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([existingEntity]);

      const saveSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'save')
        .mockImplementation(async (entities: any) => entities);

      // Act
      await programRegistrationAttributesService.upsertProgramRegistrationAttributes(
        {
          programId,
          programRegistrationAttributes: [updateDto],
        },
      );

      // Assert
      const savedEntities = saveSpy.mock.calls[0][0];
      expect(savedEntities).toHaveLength(1);
      expect(savedEntities[0].id).toBe(10); // Keeps original ID
      expect(savedEntities[0].name).toBe('firstName');
      expect(savedEntities[0].label).toEqual({ en: 'Updated First Name' });
      expect(savedEntities[0].isRequired).toBe(true);
    });
  });

  describe('deleteProgramRegistrationAttribute', () => {
    it('should scope lookup by both program id and attribute id before delete', async () => {
      // Arrange
      const programId = 1;
      const programRegistrationAttributeId = 99;
      const attributeEntity = createAttributeEntity({
        id: programRegistrationAttributeId,
        programId,
      });

      const findOneSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'findOne')
        .mockResolvedValue(attributeEntity);
      const removeSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'remove')
        .mockResolvedValue(attributeEntity);

      // Act
      const result =
        await programRegistrationAttributesService.deleteProgramRegistrationAttribute(
          programId,
          programRegistrationAttributeId,
        );

      // Assert
      expect(result).toEqual(attributeEntity);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          id: Equal(programRegistrationAttributeId),
          programId: Equal(programId),
        },
      });
      expect(removeSpy).toHaveBeenCalledWith(attributeEntity);
    });

    it('should throw not found when attribute does not exist in the given program', async () => {
      // Arrange
      const programId = 1;
      const programRegistrationAttributeId = 99;

      jest
        .spyOn(programRegistrationAttributeRepository, 'findOne')
        .mockResolvedValue(null);

      // Act + Assert
      await expect(
        programRegistrationAttributesService.deleteProgramRegistrationAttribute(
          programId,
          programRegistrationAttributeId,
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: expect.stringContaining(
              `attribute with id: '${programRegistrationAttributeId}' not found for program '${programId}'`,
            ),
          }),
        }),
      );
    });
  });

  describe('update registration attributes in batch', () => {
    const programId = 1;

    const makeExistingAttributes = () => {
      const existingFirstNameEntity = createAttributeEntity({
        id: 10,
        name: 'firstName',
        label: { en: 'Old First Name Label' },
        isRequired: false,
      });
      const existingLastNameEntity = createAttributeEntity({
        id: 11,
        name: 'lastName',
        label: { en: 'Old Last Name Label' },
        isRequired: false,
      });

      return { existingFirstNameEntity, existingLastNameEntity };
    };

    it('should update attributes and return updated entities', async () => {
      // Arrange
      const { existingFirstNameEntity, existingLastNameEntity } =
        makeExistingAttributes();

      const attributesToUpdate: UpdateProgramRegistrationAttributesBatchDto[] =
        [
          {
            programRegistrationAttributeName: 'firstName',
            updateProgramRegistrationAttribute: {
              label: { en: 'New First Name Label' },
            },
          },
          {
            programRegistrationAttributeName: 'lastName',
            updateProgramRegistrationAttribute: {
              label: { en: 'New Last Name Label' },
            },
          },
        ];

      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([existingFirstNameEntity, existingLastNameEntity]);

      const saveSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'save')
        .mockImplementation(async (entities: any) => entities);

      // Act
      const result =
        await programRegistrationAttributesService.updateBatchProgramRegistrationAttributes(
          {
            programId,
            attributesToUpdate,
          },
        );

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'firstName',
            label: { en: 'New First Name Label' },
          }),
          expect.objectContaining({
            name: 'lastName',
            label: { en: 'New Last Name Label' },
          }),
        ]),
      );
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should return not found when updating a non existing attribute', async () => {
      // Arrange
      const { existingFirstNameEntity, existingLastNameEntity } =
        makeExistingAttributes();

      const attributesToUpdate: UpdateProgramRegistrationAttributesBatchDto[] =
        [
          {
            programRegistrationAttributeName: 'familyName',
            updateProgramRegistrationAttribute: {
              label: { en: 'New Family Name Label' },
            },
          },
          {
            programRegistrationAttributeName: 'lastName',
            updateProgramRegistrationAttribute: {
              label: { en: 'New Last Name Label' },
            },
          },
        ];

      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([existingFirstNameEntity, existingLastNameEntity]);

      // Act + Assert
      await expect(
        programRegistrationAttributesService.updateBatchProgramRegistrationAttributes(
          {
            programId,
            attributesToUpdate,
          },
        ),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.NOT_FOUND);
    });
  });
});

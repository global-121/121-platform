import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessGroupLevelRepository } from '@121-service/src/programs/access-group-levels/access-group-level.repository';
import { AccessGroupLevelsService } from '@121-service/src/programs/access-group-levels/access-group-levels.service';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationAttributeDataRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-attribute-data.repository';

describe('AccessGroupLevelsService', () => {
  let service: AccessGroupLevelsService;
  let registrationAttributeDataRepository: RegistrationAttributeDataRepository;
  let accessGroupLevelRepository: {
    replaceForProgram: jest.Mock;
    findOrderedAttributeNamesByProgramId: jest.Mock;
  };

  const programId = 1;

  const createAttributeEntity = (
    overrides: Partial<ProgramRegistrationAttributeEntity> = {},
  ): ProgramRegistrationAttributeEntity => {
    const entity = new ProgramRegistrationAttributeEntity();
    entity.id = 1;
    entity.programId = programId;
    entity.name = 'defaultAttribute';
    entity.type = RegistrationAttributeTypes.dropdown;
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
        AccessGroupLevelsService,
        {
          provide: AccessGroupLevelRepository,
          useValue: {
            replaceForProgram: jest.fn(),
            findOrderedAttributeNamesByProgramId: jest.fn(),
          },
        },
        {
          provide: RegistrationAttributeDataRepository,
          useValue: {
            getValuesInUse: jest.fn().mockResolvedValue(new Set()),
          },
        },
      ],
    }).compile();

    service = module.get<AccessGroupLevelsService>(AccessGroupLevelsService);
    registrationAttributeDataRepository =
      module.get<RegistrationAttributeDataRepository>(
        RegistrationAttributeDataRepository,
      );
    accessGroupLevelRepository = module.get(AccessGroupLevelRepository);
  });

  describe('updateAccessGroupLevels', () => {
    it('should validate the names, replace the levels with the matching attribute ids and return the validated names', async () => {
      // Arrange
      const activeRegistrationAttributes = [
        createAttributeEntity({ id: 1, name: 'region' }),
        createAttributeEntity({ id: 2, name: 'district' }),
      ];

      // Act
      const result = await service.updateAccessGroupLevels({
        programId,
        activeRegistrationAttributes,
        accessGroupRegistrationAttributeNames: ['region', 'district'],
      });

      // Assert
      expect(accessGroupLevelRepository.replaceForProgram).toHaveBeenCalledWith(
        {
          programId,
          orderedProgramRegistrationAttributeIds: [1, 2],
        },
      );
      expect(result).toEqual(['region', 'district']);
    });

    it('should clear the levels when the selection is empty', async () => {
      // Act
      const result = await service.updateAccessGroupLevels({
        programId,
        activeRegistrationAttributes: [],
        accessGroupRegistrationAttributeNames: [],
      });

      // Assert
      expect(accessGroupLevelRepository.replaceForProgram).toHaveBeenCalledWith(
        {
          programId,
          orderedProgramRegistrationAttributeIds: [],
        },
      );
      expect(result).toEqual([]);
    });
  });

  describe('Retrieving the configured access group registration attribute names', () => {
    it('should return the names in the order stored by the repository', async () => {
      // Arrange
      accessGroupLevelRepository.findOrderedAttributeNamesByProgramId.mockResolvedValue(
        ['region', 'district'],
      );

      // Act
      const result = await service.getAccessGroupRegistrationAttributeNames({
        programId,
      });

      // Assert
      expect(result).toEqual(['region', 'district']);
    });

    it('should return null when no access group levels are configured', async () => {
      // Arrange
      accessGroupLevelRepository.findOrderedAttributeNamesByProgramId.mockResolvedValue(
        null,
      );

      // Act
      const result = await service.getAccessGroupRegistrationAttributeNames({
        programId,
      });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Retrieving access group levels', () => {
    it('should return the configured attribute names when access group levels exist', async () => {
      // Arrange
      accessGroupLevelRepository.findOrderedAttributeNamesByProgramId.mockResolvedValue(
        ['region', 'district'],
      );

      // Act
      const result = await service.getAccessGroupLevels({ programId });

      // Assert
      expect(result).toEqual(['region', 'district']);
    });

    it('should return an empty array when no access group levels are configured', async () => {
      // Arrange
      accessGroupLevelRepository.findOrderedAttributeNamesByProgramId.mockResolvedValue(
        null,
      );

      // Act
      const result = await service.getAccessGroupLevels({ programId });

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Validating access group registration attribute names', () => {
    it('should return null when attributeNames is null', () => {
      // Act
      const result = service.validateAccessGroupRegistrationAttributeNames({
        programId,
        activeRegistrationAttributes: [],
        selectedAttributeNames: null,
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when attributeNames is an empty array', () => {
      // Act
      const result = service.validateAccessGroupRegistrationAttributeNames({
        programId,
        activeRegistrationAttributes: [],
        selectedAttributeNames: [],
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should return the attribute names when all are valid dropdown attributes', () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({ name: 'region' }),
        createAttributeEntity({ name: 'district' }),
      ];

      // Act
      const result = service.validateAccessGroupRegistrationAttributeNames({
        programId,
        activeRegistrationAttributes: programRegistrationAttributes,
        selectedAttributeNames: ['region', 'district'],
      });

      // Assert
      expect(result).toEqual(['region', 'district']);
    });

    it('should throw when the same attribute name is provided more than once', async () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({ name: 'region' }),
      ];

      // Act + Assert
      await expect(
        (async () =>
          service.validateAccessGroupRegistrationAttributeNames({
            programId,
            activeRegistrationAttributes: programRegistrationAttributes,
            selectedAttributeNames: ['region', 'region'],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when more than 3 attribute names are provided', async () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({ name: 'region' }),
        createAttributeEntity({ name: 'district' }),
        createAttributeEntity({ name: 'subDistrict' }),
        createAttributeEntity({ name: 'village' }),
      ];

      // Act + Assert
      await expect(
        (async () =>
          service.validateAccessGroupRegistrationAttributeNames({
            programId,
            activeRegistrationAttributes: programRegistrationAttributes,
            selectedAttributeNames: [
              'region',
              'district',
              'subDistrict',
              'village',
            ],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an attribute does not exist on the program', async () => {
      // Act + Assert
      await expect(
        (async () =>
          service.validateAccessGroupRegistrationAttributeNames({
            programId,
            activeRegistrationAttributes: [],
            selectedAttributeNames: ['nonExistentAttribute'],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an attribute is not of type dropdown', async () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({
          name: 'notes',
          type: RegistrationAttributeTypes.text,
        }),
      ];

      // Act + Assert
      await expect(
        (async () =>
          service.validateAccessGroupRegistrationAttributeNames({
            programId,
            activeRegistrationAttributes: programRegistrationAttributes,
            selectedAttributeNames: ['notes'],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Validating whether an attribute delete is allowed', () => {
    it('should throw when deleting an attribute used for access group configuration', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act + Assert
      expect(() =>
        service.validateAttributeDeleteAllowed({
          accessGroupRegistrationAttributeNames: ['region'],
          existingAttribute: attribute,
        }),
      ).toThrow();
    });

    it('should not throw when deleting an attribute that is not used for access group configuration', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'notes' });

      // Act + Assert
      expect(() =>
        service.validateAttributeDeleteAllowed({
          accessGroupRegistrationAttributeNames: ['region'],
          existingAttribute: attribute,
        }),
      ).not.toThrow();
    });
  });

  describe('Checking for an access group attribute type violation', () => {
    it('should return a type violation when the attribute is locked and its type changes', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act
      const result = service.getAccessGroupAttributeTypeViolation({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: RegistrationAttributeTypes.text,
      });

      // Assert
      expect(result).toEqual({ reason: 'type' });
    });

    it('should return undefined when the attribute is locked and its type is unchanged', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act
      const result = service.getAccessGroupAttributeTypeViolation({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: RegistrationAttributeTypes.dropdown,
      });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when the attribute is locked and no type is provided', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act
      const result = service.getAccessGroupAttributeTypeViolation({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: undefined,
      });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when the attribute is not locked', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'notes' });

      // Act
      const result = service.getAccessGroupAttributeTypeViolation({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: RegistrationAttributeTypes.text,
      });

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Validating whether an attribute update is allowed', () => {
    describe('Access group lock on type change', () => {
      it('should throw when changing the type of an attribute used for access group configuration', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          type: RegistrationAttributeTypes.dropdown,
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: { type: RegistrationAttributeTypes.text },
          }),
        ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      });

      it('should not throw when the type stays dropdown for an attribute used for access group configuration', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          type: RegistrationAttributeTypes.dropdown,
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: { type: RegistrationAttributeTypes.dropdown },
          }),
        ).resolves.not.toThrow();
      });

      it('should not throw when changing the type of an attribute that is not used for access group configuration', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'notes',
          type: RegistrationAttributeTypes.dropdown,
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: { type: RegistrationAttributeTypes.text },
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('Access group lock on options change', () => {
      it('should throw when removing an option that is in use by a registration', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          id: 10,
          name: 'region',
          options: [
            { option: 'utrecht', label: { en: 'Utrecht' } },
            { option: 'zuidholland', label: { en: 'Zuid-Holland' } },
          ],
        });
        (
          registrationAttributeDataRepository.getValuesInUse as jest.Mock
        ).mockResolvedValue(new Set(['utrecht']));

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: {
              options: [{ option: 'zuidholland' }],
            },
          }),
        ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      });

      it('should not throw when removing an option that is not in use by any registration or assignment', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          id: 10,
          name: 'region',
          options: [
            { option: 'utrecht', label: { en: 'Utrecht' } },
            { option: 'zuidholland', label: { en: 'Zuid-Holland' } },
          ],
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: {
              options: [{ option: 'zuidholland' }],
            },
          }),
        ).resolves.not.toThrow();
      });

      it('should not throw when an options update only relabels an existing option', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: {
              options: [{ option: 'utrecht' }],
            },
          }),
        ).resolves.not.toThrow();
      });

      it('should not throw when an options update only adds a new option', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: {
              options: [{ option: 'utrecht' }, { option: 'zuidholland' }],
            },
          }),
        ).resolves.not.toThrow();
      });

      it('should not throw when an options update happens on an attribute not used for access group configuration', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'notes',
          options: [{ option: 'a', label: { en: 'A' } }],
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            update: { options: [] },
          }),
        ).resolves.not.toThrow();
      });

      it('should not throw when options is null', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
        });

        // Act + Assert
        await expect(
          service.validateAttributeUpdateAllowed({
            accessGroupRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,

            update: { options: null as any },
          }),
        ).resolves.not.toThrow();
      });
    });
  });
});

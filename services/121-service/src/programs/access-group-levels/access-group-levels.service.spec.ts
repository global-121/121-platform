import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessGroupLevelRepository } from '@121-service/src/programs/access-group-levels/access-group-level.repository';
import { AccessGroupLevelsService } from '@121-service/src/programs/access-group-levels/access-group-levels.service';
import { MAX_ACCESS_GROUP_LEVELS } from '@121-service/src/programs/access-group-levels/const/max-access-group-levels.const';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationAttributeDataRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-attribute-data.repository';

describe('AccessGroupLevelsService', () => {
  let service: AccessGroupLevelsService;
  let registrationAttributeDataRepository: RegistrationAttributeDataRepository;
  let accessGroupLevelRepository: {
    replaceForProgram: jest.Mock;
    getOrderedAttributeNamesByProgramId: jest.Mock;
    getOrderedAttributesByProgramId: jest.Mock;
  };
  let assignmentAccessGroupRepository: {
    getAssignedProgramRegistrationAttributeIds: jest.Mock;
  };

  const programId = 1;

  const regionAttribute = { id: 1, name: 'region' };
  const districtAttribute = { id: 2, name: 'district' };
  const wardAttribute = { id: 3, name: 'ward' };

  const createAttributeNames = ({ count }: { count: number }): string[] =>
    Array.from({ length: count }, (_, index) => `attribute${index}`);

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

  const givenConfiguredLevelsAndAssignments = ({
    configuredLevels,
    assignedAttributeIds,
  }: {
    configuredLevels: { id: number; name: string }[];
    assignedAttributeIds: number[];
  }): void => {
    accessGroupLevelRepository.getOrderedAttributesByProgramId.mockResolvedValue(
      configuredLevels.map(({ id, name }) => ({
        programRegistrationAttributeId: id,
        name,
        optionValues: new Set(),
      })),
    );
    const assignedAttributeIdSet = new Set(assignedAttributeIds);
    assignmentAccessGroupRepository.getAssignedProgramRegistrationAttributeIds.mockImplementation(
      async ({
        programRegistrationAttributeIds,
      }: {
        programRegistrationAttributeIds: number[];
      }) =>
        new Set(
          programRegistrationAttributeIds.filter((id) =>
            assignedAttributeIdSet.has(id),
          ),
        ),
    );
  };

  beforeEach(async () => {
    accessGroupLevelRepository = {
      replaceForProgram: jest.fn(),
      getOrderedAttributeNamesByProgramId: jest.fn().mockResolvedValue([]),
      getOrderedAttributesByProgramId: jest.fn().mockResolvedValue([]),
    };
    assignmentAccessGroupRepository = {
      getAssignedProgramRegistrationAttributeIds: jest
        .fn()
        .mockResolvedValue(new Set()),
    };
    const mockRegistrationAttributeDataRepository = {
      getValuesInUse: jest.fn().mockResolvedValue(new Set()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessGroupLevelsService,
        {
          provide: AccessGroupLevelRepository,
          useValue: accessGroupLevelRepository,
        },
        {
          provide: RegistrationAttributeDataRepository,
          useValue: mockRegistrationAttributeDataRepository,
        },
        {
          provide: ProgramAidworkerAssignmentAccessGroupRepository,
          useValue: assignmentAccessGroupRepository,
        },
      ],
    }).compile();

    service = module.get<AccessGroupLevelsService>(AccessGroupLevelsService);
    registrationAttributeDataRepository =
      module.get<RegistrationAttributeDataRepository>(
        RegistrationAttributeDataRepository,
      );
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

    it('should throw an error naming the level when a level that is assigned to users is replaced', async () => {
      // Arrange
      givenConfiguredLevelsAndAssignments({
        configuredLevels: [regionAttribute, districtAttribute],
        assignedAttributeIds: [regionAttribute.id, districtAttribute.id],
      });
      const activeRegistrationAttributes = [
        createAttributeEntity(regionAttribute),
        createAttributeEntity(wardAttribute),
      ];

      // Act & Assert
      await expect(
        service.updateAccessGroupLevels({
          programId,
          activeRegistrationAttributes,
          accessGroupRegistrationAttributeNames: ['region', 'ward'],
        }),
      ).rejects.toThrow(
        `Access group level 'district' cannot be moved or removed because it is assigned to users in program ${programId}. Remove this access group from the users first.`,
      );
    });

    it('should throw an error when levels that are assigned to users are reordered', async () => {
      // Arrange
      givenConfiguredLevelsAndAssignments({
        configuredLevels: [regionAttribute, districtAttribute],
        assignedAttributeIds: [regionAttribute.id],
      });
      const activeRegistrationAttributes = [
        createAttributeEntity(regionAttribute),
        createAttributeEntity(districtAttribute),
      ];

      // Act & Assert
      await expect(
        service.updateAccessGroupLevels({
          programId,
          activeRegistrationAttributes,
          accessGroupRegistrationAttributeNames: ['district', 'region'],
        }),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should allow removing a lower level that is not assigned to users while a higher level is', async () => {
      // Arrange
      givenConfiguredLevelsAndAssignments({
        configuredLevels: [regionAttribute, districtAttribute, wardAttribute],
        assignedAttributeIds: [regionAttribute.id, districtAttribute.id],
      });
      const activeRegistrationAttributes = [
        createAttributeEntity(regionAttribute),
        createAttributeEntity(districtAttribute),
      ];

      // Act
      await service.updateAccessGroupLevels({
        programId,
        activeRegistrationAttributes,
        accessGroupRegistrationAttributeNames: ['region', 'district'],
      });

      // Assert
      expect(accessGroupLevelRepository.replaceForProgram).toHaveBeenCalledWith(
        {
          programId,
          orderedProgramRegistrationAttributeIds: [
            regionAttribute.id,
            districtAttribute.id,
          ],
        },
      );
    });

    it('should allow adding a lower level while the existing levels are assigned to users', async () => {
      // Arrange
      givenConfiguredLevelsAndAssignments({
        configuredLevels: [regionAttribute],
        assignedAttributeIds: [regionAttribute.id],
      });
      const activeRegistrationAttributes = [
        createAttributeEntity(regionAttribute),
        createAttributeEntity(districtAttribute),
      ];

      // Act
      await service.updateAccessGroupLevels({
        programId,
        activeRegistrationAttributes,
        accessGroupRegistrationAttributeNames: ['region', 'district'],
      });

      // Assert
      expect(accessGroupLevelRepository.replaceForProgram).toHaveBeenCalledWith(
        {
          programId,
          orderedProgramRegistrationAttributeIds: [
            regionAttribute.id,
            districtAttribute.id,
          ],
        },
      );
    });
  });

  describe('Retrieving the configured access group registration attribute names', () => {
    it('should return the names in the order stored by the repository', async () => {
      // Arrange
      accessGroupLevelRepository.getOrderedAttributeNamesByProgramId.mockResolvedValue(
        ['region', 'district'],
      );

      // Act
      const result = await service.getAccessGroupRegistrationAttributeNames({
        programId,
      });

      // Assert
      expect(result).toEqual(['region', 'district']);
    });

    it('should return an empty array when no access group levels are configured', async () => {
      // Arrange
      accessGroupLevelRepository.getOrderedAttributeNamesByProgramId.mockResolvedValue(
        [],
      );

      // Act
      const result = await service.getAccessGroupRegistrationAttributeNames({
        programId,
      });

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Validating access group registration attribute names', () => {
    it('should return an empty array when attributeNames is null', () => {
      // Act
      const result = service.validateAccessGroupRegistrationAttributeNames({
        programId,
        activeRegistrationAttributes: [],
        selectedAttributeNames: null,
      });

      // Assert
      expect(result).toEqual([]);
    });

    it('should return an empty array when attributeNames is an empty array', () => {
      // Act
      const result = service.validateAccessGroupRegistrationAttributeNames({
        programId,
        activeRegistrationAttributes: [],
        selectedAttributeNames: [],
      });

      // Assert
      expect(result).toEqual([]);
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

    it('should return the attribute names when exactly the maximum number of levels is provided', () => {
      // Arrange
      const attributeNames = createAttributeNames({
        count: MAX_ACCESS_GROUP_LEVELS,
      });
      const programRegistrationAttributes = attributeNames.map((name) =>
        createAttributeEntity({ name }),
      );

      // Act
      const result = service.validateAccessGroupRegistrationAttributeNames({
        programId,
        activeRegistrationAttributes: programRegistrationAttributes,
        selectedAttributeNames: attributeNames,
      });

      // Assert
      expect(result).toEqual(attributeNames);
    });

    it('should throw when more than the maximum number of levels is provided', async () => {
      // Arrange
      const attributeNames = createAttributeNames({
        count: MAX_ACCESS_GROUP_LEVELS + 1,
      });
      const programRegistrationAttributes = attributeNames.map((name) =>
        createAttributeEntity({ name }),
      );

      // Act + Assert
      await expect(
        (async () =>
          service.validateAccessGroupRegistrationAttributeNames({
            programId,
            activeRegistrationAttributes: programRegistrationAttributes,
            selectedAttributeNames: attributeNames,
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

  describe('Checking whether an access group attribute type is violated', () => {
    it('should return true when the attribute is locked and its type changes', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act
      const result = service.isAccessGroupAttributeTypeViolated({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: RegistrationAttributeTypes.text,
      });

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when the attribute is locked and its type is unchanged', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act
      const result = service.isAccessGroupAttributeTypeViolated({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: RegistrationAttributeTypes.dropdown,
      });

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when the attribute is locked and no type is provided', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'region' });

      // Act
      const result = service.isAccessGroupAttributeTypeViolated({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: undefined,
      });

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when the attribute is not locked', () => {
      // Arrange
      const attribute = createAttributeEntity({ name: 'notes' });

      // Act
      const result = service.isAccessGroupAttributeTypeViolated({
        accessGroupRegistrationAttributeNames: ['region'],
        existingAttribute: attribute,
        type: RegistrationAttributeTypes.text,
      });

      // Assert
      expect(result).toBe(false);
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

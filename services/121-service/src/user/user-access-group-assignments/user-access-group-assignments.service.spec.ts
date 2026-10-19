import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AccessGroupLevelsService } from '@121-service/src/programs/access-group-levels/access-group-levels.service';
import { AccessGroupLevelAttribute } from '@121-service/src/programs/access-group-levels/interfaces/access-group-level-attribute.interface';
import { ProgramAidworkerAssignmentAccessGroupEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.entity';
import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';
import { UserAccessGroupAssignmentsService } from '@121-service/src/user/user-access-group-assignments/user-access-group-assignments.service';

describe('UserAccessGroupAssignmentsService', () => {
  const programId = 5;
  const countyAttributeId = 11;
  const subCountyAttributeId = 12;
  const wardAttributeId = 13;

  // Highest level first
  const levels: AccessGroupLevelAttribute[] = [
    {
      programRegistrationAttributeId: countyAttributeId,
      name: 'county',
      optionValues: new Set(['kisumu', 'nairobi']),
    },
    {
      programRegistrationAttributeId: subCountyAttributeId,
      name: 'subCounty',
      optionValues: new Set(['kisumu-west', 'kisumu-east']),
    },
    {
      programRegistrationAttributeId: wardAttributeId,
      name: 'ward',
      optionValues: new Set(['central']),
    },
  ];

  let service: UserAccessGroupAssignmentsService;
  let accessGroupLevelsService: jest.Mocked<
    Pick<
      AccessGroupLevelsService,
      | 'getAccessGroupLevelAttributes'
      | 'getAccessGroupRegistrationAttributeNames'
    >
  >;
  let assignmentAccessGroupRepository: jest.Mocked<
    Pick<
      ProgramAidworkerAssignmentAccessGroupRepository,
      'replaceForAssignment' | 'find'
    >
  >;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserAccessGroupAssignmentsService,
        {
          provide: AccessGroupLevelsService,
          useValue: {
            getAccessGroupLevelAttributes: jest.fn().mockResolvedValue(levels),
            getAccessGroupRegistrationAttributeNames: jest
              .fn()
              .mockResolvedValue(levels.map(({ name }) => name)),
          },
        },
        {
          provide: ProgramAidworkerAssignmentAccessGroupRepository,
          useValue: { replaceForAssignment: jest.fn(), find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UserAccessGroupAssignmentsService);
    accessGroupLevelsService = module.get(AccessGroupLevelsService);
    assignmentAccessGroupRepository = module.get(
      ProgramAidworkerAssignmentAccessGroupRepository,
    );
  });

  describe('Validating and resolving the access groups of a program assignment', () => {
    const accessGroup = (name: string, value: string) => ({
      programRegistrationAttributeName: name,
      value,
    });

    it('should return undefined and not look up the levels when no access groups are given', async () => {
      // Act
      const result = await service.validateAndResolveAccessGroups({
        programId,
        accessGroups: undefined,
      });

      // Assert
      expect(result).toBeUndefined();
      expect(
        accessGroupLevelsService.getAccessGroupLevelAttributes,
      ).not.toHaveBeenCalled();
    });

    it('should return no access groups and not look up the levels when an empty list is given', async () => {
      // Act
      const result = await service.validateAndResolveAccessGroups({
        programId,
        accessGroups: [],
      });

      // Assert
      expect(result).toEqual([]);
      expect(
        accessGroupLevelsService.getAccessGroupLevelAttributes,
      ).not.toHaveBeenCalled();
    });

    it('should replace the attribute names by attribute ids, keeping the order of the payload', async () => {
      // Act
      const result = await service.validateAndResolveAccessGroups({
        programId,
        accessGroups: [
          accessGroup('subCounty', 'kisumu-west'),
          accessGroup('county', 'kisumu'),
        ],
      });

      // Assert
      expect(result).toEqual([
        {
          programRegistrationAttributeId: subCountyAttributeId,
          value: 'kisumu-west',
        },
        { programRegistrationAttributeId: countyAttributeId, value: 'kisumu' },
      ]);
    });

    it('should throw when no access group levels are configured for the program', async () => {
      // Arrange
      accessGroupLevelsService.getAccessGroupLevelAttributes.mockResolvedValue(
        [],
      );

      // Act & Assert
      await expect(
        service.validateAndResolveAccessGroups({
          programId,
          accessGroups: [accessGroup('county', 'kisumu')],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: `No access group levels are configured for program ${programId}`,
      });
    });

    it('should throw when an attribute is not an access group level of the program', async () => {
      // Act & Assert
      await expect(
        service.validateAndResolveAccessGroups({
          programId,
          accessGroups: [accessGroup('unknown', 'kisumu')],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: `Registration attribute 'unknown' is not an access group level of program ${programId}`,
      });
    });

    it('should throw when the same level is provided more than once', async () => {
      // Act & Assert
      await expect(
        service.validateAndResolveAccessGroups({
          programId,
          accessGroups: [
            accessGroup('county', 'kisumu'),
            accessGroup('county', 'nairobi'),
          ],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: "Access group level 'county' is provided more than once",
      });
    });

    it('should throw when a level in between is skipped', async () => {
      // Act & Assert
      await expect(
        service.validateAndResolveAccessGroups({
          programId,
          accessGroups: [
            accessGroup('county', 'kisumu'),
            accessGroup('ward', 'central'),
          ],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: expect.stringContaining("Missing level: 'subCounty'"),
      });
    });

    it('should throw when the value is not an option of the level', async () => {
      // Act & Assert
      await expect(
        service.validateAndResolveAccessGroups({
          programId,
          accessGroups: [accessGroup('county', 'mombasa')],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message:
          "Value 'mombasa' is not an option of access group level 'county'",
      });
    });
  });

  describe('Getting the access groups of an assignment', () => {
    const programAidworkerAssignmentId = 100;
    const storedAccessGroup = (name: string, value: string) => ({
      programAidworkerAssignmentId,
      value,
      programRegistrationAttribute: { name },
    });

    const mockStoredAccessGroups = (
      storedAccessGroups: ReturnType<typeof storedAccessGroup>[],
    ): void => {
      assignmentAccessGroupRepository.find.mockResolvedValue(
        storedAccessGroups as unknown as ProgramAidworkerAssignmentAccessGroupEntity[],
      );
    };

    it('should return no access groups and not look up the levels when the assignment has none', async () => {
      // Arrange
      mockStoredAccessGroups([]);

      // Act
      const result = await service.getAccessGroupsOfAssignment({
        programAidworkerAssignmentId,
        programId,
      });

      // Assert
      expect(result).toEqual([]);
      expect(
        accessGroupLevelsService.getAccessGroupRegistrationAttributeNames,
      ).not.toHaveBeenCalled();
    });

    it('should return the access groups from the highest level down, regardless of the order they are stored in', async () => {
      // Arrange
      mockStoredAccessGroups([
        storedAccessGroup('subCounty', 'kisumu-west'),
        storedAccessGroup('county', 'kisumu'),
      ]);

      // Act
      const result = await service.getAccessGroupsOfAssignment({
        programAidworkerAssignmentId,
        programId,
      });

      // Assert
      expect(result).toEqual([
        { programRegistrationAttributeName: 'county', value: 'kisumu' },
        {
          programRegistrationAttributeName: 'subCounty',
          value: 'kisumu-west',
        },
      ]);
    });

    it('should return an access group of an attribute that is no longer a level last', async () => {
      // Arrange
      mockStoredAccessGroups([
        storedAccessGroup('formerLevel', 'some-value'),
        storedAccessGroup('county', 'kisumu'),
      ]);

      // Act
      const result = await service.getAccessGroupsOfAssignment({
        programAidworkerAssignmentId,
        programId,
      });

      // Assert
      expect(result).toEqual([
        { programRegistrationAttributeName: 'county', value: 'kisumu' },
        {
          programRegistrationAttributeName: 'formerLevel',
          value: 'some-value',
        },
      ]);
    });

    it('should get the ordered access groups for multiple assignments in one lookup', async () => {
      // Arrange
      assignmentAccessGroupRepository.find.mockResolvedValue([
        {
          programAidworkerAssignmentId: 100,
          value: 'kisumu-west',
          programRegistrationAttribute: { name: 'subCounty' },
        },
        {
          programAidworkerAssignmentId: 101,
          value: 'nairobi',
          programRegistrationAttribute: { name: 'county' },
        },
        {
          programAidworkerAssignmentId: 100,
          value: 'kisumu',
          programRegistrationAttribute: { name: 'county' },
        },
      ] as unknown as ProgramAidworkerAssignmentAccessGroupEntity[]);

      // Act
      const result = await service.getAccessGroupsByAssignmentId({
        programAidworkerAssignmentIds: [100, 101],
        programId,
      });

      // Assert
      expect(result).toEqual(
        new Map([
          [
            100,
            [
              { programRegistrationAttributeName: 'county', value: 'kisumu' },
              {
                programRegistrationAttributeName: 'subCounty',
                value: 'kisumu-west',
              },
            ],
          ],
          [
            101,
            [{ programRegistrationAttributeName: 'county', value: 'nairobi' }],
          ],
        ]),
      );
    });
  });

  describe('Replacing the access groups of a program assignment', () => {
    const programAidworkerAssignmentId = 100;

    it('should leave the existing access groups untouched when no access groups are given', async () => {
      // Act
      await service.replaceAccessGroups({
        programAidworkerAssignmentId,
        accessGroups: undefined,
      });

      // Assert
      expect(
        assignmentAccessGroupRepository.replaceForAssignment,
      ).not.toHaveBeenCalled();
    });

    it('should replace the existing access groups, also with none when an empty list is given', async () => {
      // Act
      await service.replaceAccessGroups({
        programAidworkerAssignmentId,
        accessGroups: [],
      });

      // Assert
      expect(
        assignmentAccessGroupRepository.replaceForAssignment,
      ).toHaveBeenCalledWith({
        programAidworkerAssignmentId,
        accessGroups: [],
      });
    });
  });

  describe('Reading the access groups of a user', () => {
    const programAssignments = [
      {
        programId,
        accessGroups: [
          {
            id: 10,
            programRegistrationAttributeId: countyAttributeId,
            value: 'kisumu',
          },
        ],
      },
    ];

    it('should return the access groups of the assignment to the program', () => {
      // Act
      const result = service.getAccessGroupsForUser({
        programAssignments,
        programId,
      });

      // Assert
      expect(result).toEqual([
        { programRegistrationAttributeId: countyAttributeId, value: 'kisumu' },
      ]);
    });

    it('should return no access groups when the user is not assigned to the program', () => {
      // Act
      const result = service.getAccessGroupsForUser({
        programAssignments,
        programId: programId + 1,
      });

      // Assert
      expect(result).toEqual([]);
    });
  });
});

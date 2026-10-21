import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { UserAccessGroupAssignmentsService } from '@121-service/src/user/user-access-group-assignments/user-access-group-assignments.service';

let mockIsProduction = false;
jest.mock('@121-service/src/config', () => ({
  ...jest.requireActual<Record<string, unknown>>('@121-service/src/config'),
  get IS_PRODUCTION(): boolean {
    return mockIsProduction;
  },
}));

describe('UserAccessGroupAssignmentsService', () => {
  const programId = 5;
  const countyAttributeId = 11;
  const subCountyAttributeId = 12;

  let service: UserAccessGroupAssignmentsService;
  let assignmentAccessGroupRepository: jest.Mocked<ProgramAidworkerAssignmentAccessGroupRepository>;

  beforeEach(async () => {
    mockIsProduction = false;
    const module = await Test.createTestingModule({
      providers: [
        UserAccessGroupAssignmentsService,
        {
          provide: ProgramRegistrationAttributeRepository,
          useValue: {
            getIdsByNames: jest.fn().mockResolvedValue(
              new Map([
                ['county', countyAttributeId],
                ['subCounty', subCountyAttributeId],
              ]),
            ),
          },
        },
        {
          provide: ProgramAidworkerAssignmentAccessGroupRepository,
          useValue: { replaceForAssignment: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UserAccessGroupAssignmentsService);
    assignmentAccessGroupRepository = module.get(
      ProgramAidworkerAssignmentAccessGroupRepository,
    );
  });

  describe('Getting the access groups of a program assignment with attribute ids', () => {
    it('should return undefined when no access groups are given', async () => {
      // Act
      const result = await service.getAccessGroupsWithAttributeIdsOrThrow({
        programId,
        accessGroups: undefined,
      });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should replace the attribute names by attribute ids, keeping order and values', async () => {
      // Act
      const result = await service.getAccessGroupsWithAttributeIdsOrThrow({
        programId,
        accessGroups: [
          { programRegistrationAttributeName: 'county', value: 'kisumu' },
          {
            programRegistrationAttributeName: 'subCounty',
            value: 'kisumu-west',
          },
        ],
      });

      // Assert
      expect(result).toEqual([
        { programRegistrationAttributeId: countyAttributeId, value: 'kisumu' },
        {
          programRegistrationAttributeId: subCountyAttributeId,
          value: 'kisumu-west',
        },
      ]);
    });

    it('should throw when an attribute does not exist in the program', async () => {
      // Act & Assert
      await expect(
        service.getAccessGroupsWithAttributeIdsOrThrow({
          programId,
          accessGroups: [
            { programRegistrationAttributeName: 'unknown', value: 'kisumu' },
          ],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: `Registration attribute 'unknown' not found in program ${programId}`,
      });
    });

    it('should refuse to set access groups in production', async () => {
      // Arrange
      mockIsProduction = true;

      // Act & Assert
      await expect(
        service.getAccessGroupsWithAttributeIdsOrThrow({
          programId,
          accessGroups: [],
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: 'Setting access groups is not available yet',
      });
    });

    it('should not refuse an assignment without access groups in production', async () => {
      // Arrange
      mockIsProduction = true;

      // Act
      const result = await service.getAccessGroupsWithAttributeIdsOrThrow({
        programId,
        accessGroups: undefined,
      });

      // Assert
      expect(result).toBeUndefined();
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

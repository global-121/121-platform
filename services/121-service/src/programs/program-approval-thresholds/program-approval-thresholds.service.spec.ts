import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';

describe('ProgramApprovalThresholdsService', () => {
  let service: ProgramApprovalThresholdsService;
  let programApprovalThresholdRepository: jest.Mocked<ProgramApprovalThresholdRepository>;
  let programAidworkerAssignmentRepository: jest.Mocked<ProgramAidworkerAssignmentRepository>;

  const programId = 1;

  // Helper functions for creating test data
  const createMockThreshold = (
    overrides?: Partial<ProgramApprovalThresholdEntity>,
  ): ProgramApprovalThresholdEntity =>
    ({
      id: 1,
      programId,
      thresholdAmount: 0,
      approverAssignments: [],
      ...overrides,
    }) as ProgramApprovalThresholdEntity;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      ProgramApprovalThresholdsService,
    ).compile();

    service = unit;
    programApprovalThresholdRepository = unitRef.get(
      ProgramApprovalThresholdRepository,
    );
    programAidworkerAssignmentRepository = unitRef.get(
      ProgramAidworkerAssignmentRepository,
    );
    programAidworkerAssignmentRepository.getUserIdsWithAccessGroups.mockResolvedValue(
      new Set(),
    );
  });

  describe('createOrReplaceProgramApprovalThresholds', () => {
    const currentUserId = 99;

    it('should throw when the current user assigns themselves as approver', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [1, currentUserId] },
        { thresholdAmount: 100, userIds: [2] },
      ];

      // Act & Assert
      await expect(
        service.createOrReplaceProgramApprovalThresholds({
          programId,
          thresholds,
          currentUserId,
        }),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.FORBIDDEN);
    });

    it('should throw when no threshold with amount 0 is provided', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 100, userIds: [1] },
        { thresholdAmount: 200, userIds: [2] },
      ];

      // Act & Assert
      await expect(
        service.createOrReplaceProgramApprovalThresholds({
          programId,
          thresholds,
          currentUserId,
        }),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when duplicate threshold amounts provided', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 100, userIds: [] },
        { thresholdAmount: 100, userIds: [] },
      ];

      // Act & Assert
      await expect(
        service.createOrReplaceProgramApprovalThresholds({
          programId,
          thresholds,
          currentUserId,
        }),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when a threshold has no approvers', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [] },
        { thresholdAmount: 100, userIds: [] },
      ];

      // Act & Assert
      await expect(
        service.createOrReplaceProgramApprovalThresholds({
          programId,
          thresholds,
          currentUserId,
        }),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when the same user ID appears in multiple thresholds', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [1] },
        { thresholdAmount: 50, userIds: [1] },
      ];

      // Act & Assert
      await expect(
        service.createOrReplaceProgramApprovalThresholds({
          programId,
          thresholds,
          currentUserId,
        }),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an approver has access groups', async () => {
      // Arrange
      const userIdWithAccessGroups = 5;
      programAidworkerAssignmentRepository.find.mockResolvedValue([
        { userId: userIdWithAccessGroups, scope: '' },
      ] as ProgramAidworkerAssignmentEntity[]);
      programAidworkerAssignmentRepository.getUserIdsWithAccessGroups.mockResolvedValue(
        new Set([userIdWithAccessGroups]),
      );
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [userIdWithAccessGroups] },
      ];

      // Act
      const result = service.createOrReplaceProgramApprovalThresholds({
        programId,
        thresholds,
        currentUserId,
      });

      // Assert
      await expect(result).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.BAD_REQUEST,
      );
      await expect(result).rejects.toThrow(
        `Only users without access groups can be made approvers. The following user IDs have access groups and cannot be approvers: ${userIdWithAccessGroups}`,
      );
    });
  });

  describe('getProgramApprovalThresholds', () => {
    it('should return mapped DTOs with sorted approvers', async () => {
      // Arrange
      const thresholds = [
        createMockThreshold({
          id: 1,
          thresholdAmount: 100,
          approverAssignments: [
            { id: 2, user: { id: 2, username: 'user2' } } as any,
            { id: 1, user: { id: 1, username: 'user1' } } as any,
          ],
        }),
      ];

      programApprovalThresholdRepository.find = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].approvers).toHaveLength(2);
      // Approvers should be sorted by ID
      expect(result[0].approvers[0]).toEqual({
        id: 1,
        userId: 1,
        username: 'user1',
      });
      expect(result[0].approvers[1]).toEqual({
        id: 2,
        userId: 2,
        username: 'user2',
      });
    });
  });
});

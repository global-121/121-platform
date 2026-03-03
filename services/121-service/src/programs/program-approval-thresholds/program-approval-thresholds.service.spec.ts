import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';

describe('ProgramApprovalThresholdsService', () => {
  let service: ProgramApprovalThresholdsService;
  let programApprovalThresholdRepository: jest.Mocked<ProgramApprovalThresholdRepository>;

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
  });

  describe('replaceProgramApprovalThresholds', () => {
    it('should throw when duplicate threshold amounts provided', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 100, approvers: [] },
        { thresholdAmount: 100, approvers: [] },
      ];

      // Act & Assert
      await expect(
        service.replaceProgramApprovalThresholds(programId, thresholds),
      ).rejects.toThrow(
        new HttpException(
          'Threshold amounts must be unique. Cannot have multiple thresholds with the same amount.',
          HttpStatus.BAD_REQUEST,
        ),
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

      programApprovalThresholdRepository.getProgramApprovalThresholds = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].approvers).toHaveLength(2);
      // Approvers should be sorted by ID with order assigned
      expect(result[0].approvers[0]).toEqual({
        id: 1,
        userId: 1,
        username: 'user1',
        order: 1,
      });
      expect(result[0].approvers[1]).toEqual({
        id: 2,
        userId: 2,
        username: 'user2',
        order: 2,
      });
    });
  });
});

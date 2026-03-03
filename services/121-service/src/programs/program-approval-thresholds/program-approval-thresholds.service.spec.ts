import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';

describe('ProgramApprovalThresholdsService', () => {
  let service: ProgramApprovalThresholdsService;
  let programApprovalThresholdRepository: jest.Mocked<ProgramApprovalThresholdRepository>;

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
    const programId = 1;

    it('should throw BAD_REQUEST when duplicate threshold amounts provided', async () => {
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

    it('should successfully create thresholds without approvers', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, approvers: [] },
        { thresholdAmount: 100, approvers: [] },
      ];

      const savedThreshold1 = {
        id: 1,
        programId,
        thresholdAmount: 0,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      const savedThreshold2 = {
        id: 2,
        programId,
        thresholdAmount: 100,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest.fn().mockResolvedValue([savedThreshold1, savedThreshold2]);

      // Act
      const result = await service.replaceProgramApprovalThresholds(
        programId,
        thresholds,
      );

      // Assert
      expect(
        programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction,
      ).toHaveBeenCalledWith(programId, thresholds);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        thresholdAmount: 0,
        approvers: [],
      });
      expect(result[1]).toMatchObject({
        id: 2,
        thresholdAmount: 100,
        approvers: [],
      });
    });

    it('should throw BAD_REQUEST when aidworker assignment not found', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [{ programAidworkerAssignmentId: 999 }],
        },
      ];

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest
          .fn()
          .mockRejectedValue(
            new HttpException(
              `Program aidworker assignment with ID 999 not found for program ${programId}`,
              HttpStatus.BAD_REQUEST,
            ),
          );

      // Act & Assert
      await expect(
        service.replaceProgramApprovalThresholds(programId, thresholds),
      ).rejects.toThrow(
        new HttpException(
          `Program aidworker assignment with ID 999 not found for program ${programId}`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST when aidworker assignment belongs to different program', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [{ programAidworkerAssignmentId: 1 }],
        },
      ];

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest
          .fn()
          .mockRejectedValue(
            new HttpException(
              `Program aidworker assignment with ID 1 not found for program ${programId}`,
              HttpStatus.BAD_REQUEST,
            ),
          );

      // Act & Assert
      await expect(
        service.replaceProgramApprovalThresholds(programId, thresholds),
      ).rejects.toThrow(
        new HttpException(
          `Program aidworker assignment with ID 1 not found for program ${programId}`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST when aidworker has scope', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [{ programAidworkerAssignmentId: 1 }],
        },
      ];

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest
          .fn()
          .mockRejectedValue(
            new HttpException(
              `Only users without scope can be made approvers. Program aidworker assignment 1 has a scope.`,
              HttpStatus.BAD_REQUEST,
            ),
          );

      // Act & Assert
      await expect(
        service.replaceProgramApprovalThresholds(programId, thresholds),
      ).rejects.toThrow(
        new HttpException(
          `Only users without scope can be made approvers. Program aidworker assignment 1 has a scope.`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST when duplicate approver in same threshold', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [
            { programAidworkerAssignmentId: 1 },
            { programAidworkerAssignmentId: 1 }, // Duplicate
          ],
        },
      ];

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest
          .fn()
          .mockRejectedValue(
            new HttpException(
              `Program aidworker assignment 1 is already an approver for another threshold`,
              HttpStatus.BAD_REQUEST,
            ),
          );

      // Act & Assert
      await expect(
        service.replaceProgramApprovalThresholds(programId, thresholds),
      ).rejects.toThrow(
        new HttpException(
          `Program aidworker assignment 1 is already an approver for another threshold`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should successfully create thresholds with approvers', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [
            { programAidworkerAssignmentId: 1 },
            { programAidworkerAssignmentId: 2 },
          ],
        },
      ];

      const thresholdWithRelations = {
        id: 1,
        programId,
        thresholdAmount: 0,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [
          { id: 1, user: { id: 1, username: 'user1' } },
          { id: 2, user: { id: 2, username: 'user2' } },
        ],
      } as unknown as ProgramApprovalThresholdEntity;

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest.fn().mockResolvedValue([thresholdWithRelations]);

      // Act
      const result = await service.replaceProgramApprovalThresholds(
        programId,
        thresholds,
      );

      // Assert
      expect(
        programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction,
      ).toHaveBeenCalledWith(programId, thresholds);
      expect(result).toHaveLength(1);
      expect(result[0].approvers).toHaveLength(2);
      expect(result[0].approvers).toEqual([
        { id: 1, userId: 1, username: 'user1', order: 1 },
        { id: 2, userId: 2, username: 'user2', order: 2 },
      ]);
    });

    it('should delete existing thresholds before creating new ones', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 50, approvers: [] },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 50,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction =
        jest.fn().mockResolvedValue([savedThreshold]);

      // Act
      await service.replaceProgramApprovalThresholds(programId, thresholds);

      // Assert
      expect(
        programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction,
      ).toHaveBeenCalledWith(programId, thresholds);
    });
  });

  describe('getThresholdsForPaymentAmount', () => {
    const programId = 1;

    it('should return thresholds with amount <= payment amount sorted by approval level', async () => {
      // Arrange
      const paymentAmount = 100;
      const thresholds = [
        {
          id: 1,
          programId,
          thresholdAmount: 0,
        },
        {
          id: 2,
          programId,
          thresholdAmount: 50,
        },
        {
          id: 3,
          programId,
          thresholdAmount: 100,
        },
      ] as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.getThresholdsForPaymentAmount = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getThresholdsForPaymentAmount(
        programId,
        paymentAmount,
      );

      // Assert
      expect(
        programApprovalThresholdRepository.getThresholdsForPaymentAmount,
      ).toHaveBeenCalledWith(programId, paymentAmount);
      expect(result).toEqual(thresholds);
      expect(result).toHaveLength(3);
    });

    it('should return only thresholds below payment amount', async () => {
      // Arrange
      const paymentAmount = 75;
      const thresholds = [
        {
          id: 1,
          programId,
          thresholdAmount: 0,
        },
        {
          id: 2,
          programId,
          thresholdAmount: 50,
        },
      ] as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.getThresholdsForPaymentAmount = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getThresholdsForPaymentAmount(
        programId,
        paymentAmount,
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].thresholdAmount).toBe(0);
      expect(result[1].thresholdAmount).toBe(50);
    });

    it('should return empty array when payment amount is below all thresholds', async () => {
      // Arrange
      const paymentAmount = 5;

      programApprovalThresholdRepository.getThresholdsForPaymentAmount = jest
        .fn()
        .mockResolvedValue([]);

      // Act
      const result = await service.getThresholdsForPaymentAmount(
        programId,
        paymentAmount,
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should include threshold at exact payment amount', async () => {
      // Arrange
      const paymentAmount = 100;
      const thresholds = [
        {
          id: 1,
          programId,
          thresholdAmount: 100,
        },
      ] as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.getThresholdsForPaymentAmount = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getThresholdsForPaymentAmount(
        programId,
        paymentAmount,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].thresholdAmount).toBe(100);
    });
  });

  describe('getProgramApprovalThresholds', () => {
    it('should return thresholds with approvers sorted by approval level', async () => {
      // Arrange
      const programId = 1;
      const thresholds = [
        {
          id: 2,
          programId,
          thresholdAmount: 100,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [
            {
              id: 2,

              user: { id: 2, username: 'user2' },
            },
          ],
        },
        {
          id: 1,
          programId,
          thresholdAmount: 0,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [
            {
              id: 1,

              user: { id: 1, username: 'user1' },
            },
          ],
        },
      ] as unknown as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.getProgramApprovalThresholds = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(
        programApprovalThresholdRepository.getProgramApprovalThresholds,
      ).toHaveBeenCalledWith(programId);
      expect(result).toHaveLength(2);
      expect(result[0].approvers[0].username).toBe('user2');
      expect(result[1].approvers[0].username).toBe('user1');
    });

    it('should handle thresholds without approvers', async () => {
      // Arrange
      const programId = 1;
      const thresholds = [
        {
          id: 1,
          programId,
          thresholdAmount: 0,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [],
        },
      ] as unknown as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.getProgramApprovalThresholds = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].approvers).toEqual([]);
    });

    it('should sort approvers by order within each threshold', async () => {
      // Arrange
      const programId = 1;
      const thresholds = [
        {
          id: 1,
          programId,
          thresholdAmount: 0,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [
            {
              id: 2,

              user: { id: 2, username: 'secondUser' },
            },
            {
              id: 1,

              user: { id: 1, username: 'firstUser' },
            },
          ],
        },
      ] as unknown as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.getProgramApprovalThresholds = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(result[0].approvers[0].username).toBe('firstUser');
      expect(result[0].approvers[1].username).toBe('secondUser');
    });
  });
});

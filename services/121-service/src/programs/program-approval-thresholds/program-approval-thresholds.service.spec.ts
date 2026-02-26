import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';

describe('ProgramApprovalThresholdsService', () => {
  let service: ProgramApprovalThresholdsService;
  let programApprovalThresholdRepository: jest.Mocked<ProgramApprovalThresholdRepository>;
  let dataSource: jest.Mocked<DataSource>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      ProgramApprovalThresholdsService,
    ).compile();

    service = unit;
    programApprovalThresholdRepository = unitRef.get(
      ProgramApprovalThresholdRepository,
    );
    dataSource = unitRef.get(DataSource);

    // Mock entity manager for transactions
    mockEntityManager = {
      delete: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    } as any;

    dataSource.transaction = jest.fn().mockImplementation(async (callback) => {
      return callback(mockEntityManager);
    });
  });

  describe('replaceProgramApprovalThresholds', () => {
    const programId = 1;

    it('should throw BAD_REQUEST when duplicate threshold amounts provided', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 100, approvalLevel: 1, approvers: [] },
        { thresholdAmount: 100, approvalLevel: 2, approvers: [] },
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
        { thresholdAmount: 0, approvalLevel: 1, approvers: [] },
        { thresholdAmount: 100, approvalLevel: 2, approvers: [] },
      ];

      const savedThreshold1 = {
        id: 1,
        programId,
        thresholdAmount: 0,
        approvalLevel: 1,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      const savedThreshold2 = {
        id: 2,
        programId,
        thresholdAmount: 100,
        approvalLevel: 2,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save
        .mockResolvedValueOnce(savedThreshold1 as any)
        .mockResolvedValueOnce(savedThreshold2 as any);

      // Act
      const result = await service.replaceProgramApprovalThresholds(
        programId,
        thresholds,
      );

      // Assert
      expect(mockEntityManager.delete).toHaveBeenCalledWith(
        ProgramApprovalThresholdEntity,
        { programId: expect.anything() },
      );
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        thresholdAmount: 0,
        approvalLevel: 1,
        approvers: [],
      });
      expect(result[1]).toMatchObject({
        id: 2,
        thresholdAmount: 100,
        approvalLevel: 2,
        approvers: [],
      });
    });

    it('should throw BAD_REQUEST when aidworker assignment not found', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvalLevel: 1,
          approvers: [{ programAidworkerAssignmentId: 999 }],
        },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 0,
        approvalLevel: 1,
      } as ProgramApprovalThresholdEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save.mockResolvedValueOnce(savedThreshold);
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Assignment not found

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
          approvalLevel: 1,
          approvers: [{ programAidworkerAssignmentId: 1 }],
        },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 0,
        approvalLevel: 1,
      } as ProgramApprovalThresholdEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save.mockResolvedValueOnce(savedThreshold);
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Wrong program

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
          approvalLevel: 1,
          approvers: [{ programAidworkerAssignmentId: 1 }],
        },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 0,
        approvalLevel: 1,
      } as ProgramApprovalThresholdEntity;

      const assignmentWithScope = {
        id: 1,
        programId,
        scope: 'some-scope',
      } as ProgramAidworkerAssignmentEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save.mockResolvedValueOnce(savedThreshold);
      mockEntityManager.findOne.mockResolvedValueOnce(assignmentWithScope);

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
          approvalLevel: 1,
          approvers: [
            { programAidworkerAssignmentId: 1 },
            { programAidworkerAssignmentId: 1 }, // Duplicate
          ],
        },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 0,
        approvalLevel: 1,
      } as ProgramApprovalThresholdEntity;

      const assignment1 = {
        id: 1,
        programId,
        scope: '',
        programApprovalThresholdId: null,
      } as ProgramAidworkerAssignmentEntity;

      const assignment2 = {
        id: 1,
        programId,
        scope: '',
        programApprovalThresholdId: 2, // Already assigned to a different threshold
      } as ProgramAidworkerAssignmentEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save
        .mockResolvedValueOnce(savedThreshold)
        .mockResolvedValueOnce(assignment1); // First assignment save

      mockEntityManager.findOne
        .mockResolvedValueOnce(assignment1) // First approver assignment check
        .mockResolvedValueOnce(assignment2); // Second approver check - already assigned!

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
          approvalLevel: 1,
          approvers: [
            { programAidworkerAssignmentId: 1 },
            { programAidworkerAssignmentId: 2 },
          ],
        },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 0,
        approvalLevel: 1,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      const assignment1 = {
        id: 1,
        programId,
        scope: '',
        programApprovalThresholdId: null,
        approverOrder: null,
      } as ProgramAidworkerAssignmentEntity;

      const assignment2 = {
        id: 2,
        programId,
        scope: '',
        programApprovalThresholdId: null,
        approverOrder: null,
      } as ProgramAidworkerAssignmentEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save
        .mockResolvedValueOnce(savedThreshold) // Threshold
        .mockResolvedValueOnce(assignment1) // First assignment update
        .mockResolvedValueOnce(assignment2); // Second assignment update

      mockEntityManager.findOne
        .mockResolvedValueOnce(assignment1) // First assignment check
        .mockResolvedValueOnce(assignment2); // Second assignment check

      // Act
      const result = await service.replaceProgramApprovalThresholds(
        programId,
        thresholds,
      );

      // Assert
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3); // 1 threshold + 2 assignment updates
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        2,
        ProgramAidworkerAssignmentEntity,
        expect.objectContaining({
          id: 1,
          programApprovalThresholdId: 1,
          approverOrder: 1,
        }),
      );
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        3,
        ProgramAidworkerAssignmentEntity,
        expect.objectContaining({
          id: 2,
          programApprovalThresholdId: 1,
          approverOrder: 2,
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should delete existing thresholds before creating new ones', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 50, approvalLevel: 1, approvers: [] },
      ];

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 50,
        approvalLevel: 1,
        created: new Date(),
        updated: new Date(),
        approverAssignments: [],
      } as unknown as ProgramApprovalThresholdEntity;

      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.save.mockResolvedValueOnce(savedThreshold);

      // Act
      await service.replaceProgramApprovalThresholds(programId, thresholds);

      // Assert
      expect(mockEntityManager.delete).toHaveBeenCalledBefore(
        mockEntityManager.save as any,
      );
      expect(mockEntityManager.delete).toHaveBeenCalledWith(
        ProgramApprovalThresholdEntity,
        { programId: expect.anything() },
      );
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
          approvalLevel: 1,
        },
        {
          id: 2,
          programId,
          thresholdAmount: 50,
          approvalLevel: 2,
        },
        {
          id: 3,
          programId,
          thresholdAmount: 100,
          approvalLevel: 3,
        },
      ] as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.find = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getThresholdsForPaymentAmount(
        programId,
        paymentAmount,
      );

      // Assert
      expect(programApprovalThresholdRepository.find).toHaveBeenCalledWith({
        where: {
          programId: expect.anything(),
          thresholdAmount: expect.anything(), // LessThanOrEqual(100)
        },
        order: { approvalLevel: 'ASC' },
      });
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
          approvalLevel: 1,
        },
        {
          id: 2,
          programId,
          thresholdAmount: 50,
          approvalLevel: 2,
        },
      ] as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.find = jest
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

      programApprovalThresholdRepository.find = jest.fn().mockResolvedValue([]);

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
          approvalLevel: 1,
        },
      ] as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.find = jest
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
          approvalLevel: 2,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [
            {
              id: 2,
              approverOrder: 1,
              user: { id: 2, username: 'user2' },
            },
          ],
        },
        {
          id: 1,
          programId,
          thresholdAmount: 0,
          approvalLevel: 1,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [
            {
              id: 1,
              approverOrder: 1,
              user: { id: 1, username: 'user1' },
            },
          ],
        },
      ] as unknown as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.find = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(programApprovalThresholdRepository.find).toHaveBeenCalledWith({
        where: { programId: expect.anything() },
        order: { approvalLevel: 'ASC' },
        relations: {
          approverAssignments: {
            user: true,
          },
        },
      });
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
          approvalLevel: 1,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [],
        },
      ] as unknown as ProgramApprovalThresholdEntity;

      programApprovalThresholdRepository.find = jest
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
          approvalLevel: 1,
          created: new Date(),
          updated: new Date(),
          approverAssignments: [
            {
              id: 2,
              approverOrder: 2,
              user: { id: 2, username: 'secondUser' },
            },
            {
              id: 1,
              approverOrder: 1,
              user: { id: 1, username: 'firstUser' },
            },
          ],
        },
      ] as unknown as ProgramApprovalThresholdEntity[];

      programApprovalThresholdRepository.find = jest
        .fn()
        .mockResolvedValue(thresholds);

      // Act
      const result = await service.getProgramApprovalThresholds(programId);

      // Assert
      expect(result[0].approvers[0].username).toBe('firstUser');
      expect(result[0].approvers[1].username).toBe('secondUser');
    });
  });

  describe('deleteAllProgramApprovalThresholds', () => {
    it('should delete all thresholds for program', async () => {
      // Arrange
      const programId = 1;
      programApprovalThresholdRepository.delete = jest
        .fn()
        .mockResolvedValue({});

      // Act
      await service.deleteAllProgramApprovalThresholds(programId);

      // Assert
      expect(programApprovalThresholdRepository.delete).toHaveBeenCalledWith({
        programId: expect.anything(),
      });
    });
  });

  describe('createProgramApprovalThreshold', () => {
    it('should create a single threshold without approvers', async () => {
      // Arrange
      const programId = 1;
      const createDto: CreateProgramApprovalThresholdDto = {
        thresholdAmount: 50,
        approvalLevel: 1,
        approvers: [],
      };

      const savedThreshold = {
        id: 1,
        programId,
        thresholdAmount: 50,
        approvalLevel: 1,
        created: new Date(),
        updated: new Date(),
        approvers: [],
      } as unknown as ProgramApprovalThresholdEntity;

      programApprovalThresholdRepository.save = jest
        .fn()
        .mockResolvedValue(savedThreshold);

      // Act
      const result = await service.createProgramApprovalThreshold(
        programId,
        createDto,
      );

      // Assert
      expect(programApprovalThresholdRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          programId,
          thresholdAmount: 50,
          approvalLevel: 1,
        }),
      );
      expect(result).toMatchObject({
        id: 1,
        thresholdAmount: 50,
        approvalLevel: 1,
        approvers: [],
      });
    });
  });
});

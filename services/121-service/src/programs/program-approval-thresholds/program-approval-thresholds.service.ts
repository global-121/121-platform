import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Equal, IsNull, Not } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { CreateApproverForThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-approver-for-threshold.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';

@Injectable()
export class ProgramApprovalThresholdsService {
  public constructor(
    private readonly programApprovalThresholdRepository: ProgramApprovalThresholdRepository,
    private readonly dataSource: DataSource,
  ) {}

  public async replaceProgramApprovalThresholds(
    programId: number,
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    this.throwIfDuplicateThresholdAmounts(thresholds);

    return await this.dataSource.transaction(async (manager) => {
      // Clear existing approver assignments
      await manager.update(
        ProgramAidworkerAssignmentEntity,
        {
          programId: Equal(programId),
          programApprovalThresholdId: Not(IsNull()),
        },
        {
          programApprovalThresholdId: null,
        },
      );

      // Delete existing thresholds
      await manager.delete(ProgramApprovalThresholdEntity, {
        programId: Equal(programId),
      });

      const sortedThresholds: CreateProgramApprovalThresholdDto[] = thresholds
        .slice()
        .sort((a, b) => a.thresholdAmount - b.thresholdAmount);

      for (const thresholdDto of sortedThresholds) {
        await this.createThresholdInTransaction({
          thresholdDto,
          programId,
          manager,
        });
      }

      // Fetch results with relations
      const thresholdsWithRelations = await manager.find(
        ProgramApprovalThresholdEntity,
        {
          where: { programId: Equal(programId) },
          relations: {
            approverAssignments: {
              user: true,
            },
          },
          order: { thresholdAmount: 'ASC' },
        },
      );

      return thresholdsWithRelations.map((threshold) =>
        this.mapEntityToDto(threshold),
      );
    });
  }

  private throwIfDuplicateThresholdAmounts(
    thresholds: CreateProgramApprovalThresholdDto[],
  ): void {
    const thresholdAmounts = thresholds.map((t) => t.thresholdAmount);
    const uniqueAmounts = new Set(thresholdAmounts);
    if (thresholdAmounts.length !== uniqueAmounts.size) {
      throw new HttpException(
        'Threshold amounts must be unique. Cannot have multiple thresholds with the same amount.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async createThresholdInTransaction({
    thresholdDto,
    programId,
    manager,
  }: {
    thresholdDto: CreateProgramApprovalThresholdDto;
    programId: number;
    manager: EntityManager;
  }): Promise<void> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = thresholdDto.thresholdAmount;
    threshold.programId = programId;

    const savedThreshold = await manager.save(
      ProgramApprovalThresholdEntity,
      threshold,
    );

    if (thresholdDto.approvers && thresholdDto.approvers.length > 0) {
      for (const approverDto of thresholdDto.approvers) {
        await this.assignApproversToThresholdInTransaction({
          approverDto,
          programId,
          savedThreshold,
          manager,
        });
      }
    }
  }

  private async assignApproversToThresholdInTransaction({
    approverDto,
    programId,
    savedThreshold,
    manager,
  }: {
    approverDto: CreateApproverForThresholdDto;
    programId: number;
    savedThreshold: ProgramApprovalThresholdEntity;
    manager: EntityManager;
  }): Promise<void> {
    const aidworker = await manager.findOne(ProgramAidworkerAssignmentEntity, {
      where: {
        userId: Equal(approverDto.userId),
        programId: Equal(programId),
      },
    });

    if (!aidworker) {
      throw new HttpException(
        `No program assignment found for user ${approverDto.userId} in program ${programId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (aidworker.scope) {
      throw new HttpException(
        `Only users without scope can be made approvers. User ${approverDto.userId} has a scoped assignment.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (aidworker.programApprovalThresholdId !== null) {
      const existingThreshold = await manager.findOne(
        ProgramApprovalThresholdEntity,
        {
          where: { id: Equal(aidworker.programApprovalThresholdId) },
          select: ['thresholdAmount'],
        },
      );

      const thresholdAmount =
        aidworker.programApprovalThresholdId === savedThreshold.id
          ? savedThreshold.thresholdAmount
          : (existingThreshold?.thresholdAmount ?? null);

      throw new HttpException(
        `User ${approverDto.userId} is already an approver for threshold with amount ${thresholdAmount}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    aidworker.programApprovalThresholdId = savedThreshold.id;
    await manager.save(ProgramAidworkerAssignmentEntity, aidworker);
  }

  public async getProgramApprovalThresholds(
    programId: number,
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    const thresholds =
      await this.programApprovalThresholdRepository.getProgramApprovalThresholds(
        programId,
      );

    return thresholds.map((threshold) => this.mapEntityToDto(threshold));
  }

  public async getThresholdsForPaymentAmount(
    programId: number,
    paymentAmount: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.programApprovalThresholdRepository.getThresholdsForPaymentAmount(
      programId,
      paymentAmount,
    );
  }

  private mapEntityToDto(
    entity: ProgramApprovalThresholdEntity,
  ): GetProgramApprovalThresholdResponseDto {
    return {
      id: entity.id,
      thresholdAmount: entity.thresholdAmount,
      programId: entity.programId,
      approvers: (entity.approverAssignments || [])
        .sort((a, b) => a.id - b.id) // Sort by ID for consistent ordering
        .map((assignment) => ({
          id: assignment.id,
          userId: assignment.user?.id ?? null,
          username: assignment.user?.username ?? null,
        })),
    };
  }
}

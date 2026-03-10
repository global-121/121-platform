import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Equal, IsNull, Not } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';

@Injectable()
export class ProgramApprovalThresholdsService {
  public constructor(
    private readonly programApprovalThresholdRepository: ProgramApprovalThresholdRepository,
    private readonly programAidworkerAssignmentRepository: ProgramAidworkerAssignmentRepository,
    private readonly dataSource: DataSource,
  ) {}

  public async createOrReplaceProgramApprovalThresholds(
    programId: number,
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    const aidworkerAssignments: ProgramAidworkerAssignmentEntity[] =
      await this.programAidworkerAssignmentRepository.find({
        where: {
          programId: Equal(programId),
        },
      });

    await this.validateThresholds({ thresholds, aidworkerAssignments });

    await this.dataSource.transaction(async (manager) => {
      await this.removeProgramApprovalThresholdConfiguration({
        manager,
        programId,
      });

      await this.createProgramApprovalThresholdConfiguration({
        manager,
        programId,
        thresholds,
        aidworkerAssignments,
      });
    });

    return await this.getProgramApprovalThresholds(programId);
  }

  private async validateThresholds({
    thresholds,
    aidworkerAssignments,
  }: {
    thresholds: CreateProgramApprovalThresholdDto[];
    aidworkerAssignments: ProgramAidworkerAssignmentEntity[];
  }): Promise<void> {
    this.validateUniqueThresholdAmounts(thresholds);
    this.validateThresholdsHaveApprovers(thresholds);
    this.validateUniqueApproverUserIds(thresholds);
    this.validateApproverUserIdsExist(thresholds, aidworkerAssignments);
    this.validateApproversHaveNoScope(thresholds, aidworkerAssignments);
  }

  private validateUniqueThresholdAmounts(
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

  private validateThresholdsHaveApprovers(
    thresholds: CreateProgramApprovalThresholdDto[],
  ): void {
    const thresholdsWithoutApprovers = thresholds.filter(
      (t) => !t.userIds || t.userIds.length === 0,
    );
    if (thresholdsWithoutApprovers.length > 0) {
      const amounts = thresholdsWithoutApprovers
        .map((t) => t.thresholdAmount)
        .join(', ');
      throw new HttpException(
        `All thresholds must have at least one approver. The following threshold amounts have no approvers: ${amounts}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateUniqueApproverUserIds(
    thresholds: CreateProgramApprovalThresholdDto[],
  ): void {
    const allUserIds = thresholds.flatMap((t) => t.userIds);
    const uniqueUserIds = new Set(allUserIds);
    if (allUserIds.length !== uniqueUserIds.size) {
      throw new HttpException(
        'Approver user IDs must be unique across all thresholds. A user cannot be an approver for multiple thresholds.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateApproverUserIdsExist(
    thresholds: CreateProgramApprovalThresholdDto[],
    aidworkerAssignments: ProgramAidworkerAssignmentEntity[],
  ): void {
    const allUserIds = thresholds.flatMap((t) => t.userIds);
    const assignedUserIds = aidworkerAssignments.map((a) => a.userId);
    const invalidUserIds = allUserIds.filter(
      (userId) => !assignedUserIds.includes(userId),
    );
    if (invalidUserIds.length > 0) {
      throw new HttpException(
        `The following user IDs are not assigned to the program and cannot be approvers: ${invalidUserIds.join(
          ', ',
        )}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateApproversHaveNoScope(
    thresholds: CreateProgramApprovalThresholdDto[],
    aidworkerAssignments: ProgramAidworkerAssignmentEntity[],
  ): void {
    const allUserIds = thresholds.flatMap((t) => t.userIds);
    const scopedApprovers = aidworkerAssignments.filter(
      (a) => allUserIds.includes(a.userId) && a.scope,
    );
    if (scopedApprovers.length > 0) {
      const userIdsWithScope = scopedApprovers.map((a) => a.userId);
      throw new HttpException(
        `Only users without scope can be made approvers. The following user IDs have scoped assignments and cannot be approvers: ${userIdsWithScope.join(
          ', ',
        )}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async removeProgramApprovalThresholdConfiguration({
    manager,
    programId,
  }: {
    manager: EntityManager;
    programId: number;
  }): Promise<void> {
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

    await manager.delete(ProgramApprovalThresholdEntity, {
      programId: Equal(programId),
    });
  }

  private async createProgramApprovalThresholdConfiguration({
    manager,
    programId,
    thresholds,
    aidworkerAssignments,
  }: {
    manager: EntityManager;
    programId: number;
    thresholds: CreateProgramApprovalThresholdDto[];
    aidworkerAssignments: ProgramAidworkerAssignmentEntity[];
  }): Promise<void> {
    const sortedThresholds: CreateProgramApprovalThresholdDto[] = thresholds
      .slice()
      .sort((a, b) => a.thresholdAmount - b.thresholdAmount);

    for (const thresholdDto of sortedThresholds) {
      await this.createThresholdInTransaction({
        thresholdDto,
        programId,
        manager,
        aidworkerAssignments,
      });
    }
  }

  private async createThresholdInTransaction({
    thresholdDto,
    programId,
    manager,
    aidworkerAssignments,
  }: {
    thresholdDto: CreateProgramApprovalThresholdDto;
    programId: number;
    manager: EntityManager;
    aidworkerAssignments: ProgramAidworkerAssignmentEntity[];
  }): Promise<void> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = thresholdDto.thresholdAmount;
    threshold.programId = programId;

    const savedThreshold = await manager.save(
      ProgramApprovalThresholdEntity,
      threshold,
    );

    if (thresholdDto.userIds && thresholdDto.userIds.length > 0) {
      for (const userId of thresholdDto.userIds) {
        const aidworker = aidworkerAssignments.find((a) => a.userId === userId);
        if (aidworker) {
          aidworker.programApprovalThresholdId = savedThreshold.id;
          await manager.save(ProgramAidworkerAssignmentEntity, aidworker);
        }
      }
    }
  }

  public async getProgramApprovalThresholds(
    programId: number,
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    const thresholds = await this.programApprovalThresholdRepository.find({
      where: { programId: Equal(programId) },
      order: { thresholdAmount: 'ASC' },
      relations: {
        approverAssignments: {
          user: true,
        },
      },
    });

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

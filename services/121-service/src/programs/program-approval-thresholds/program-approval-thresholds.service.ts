import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';
import { CreateApproverForThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-approver-for-threshold.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';

@Injectable()
export class ProgramApprovalThresholdsService {
  public constructor(
    private readonly programApprovalThresholdRepository: ProgramApprovalThresholdRepository,
    private readonly aidworkerAssignmentRepository: ProgramAidworkerAssignmentRepository,
    private readonly dataSource: DataSource,
  ) {}

  public async replaceProgramApprovalThresholds(
    programId: number,
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    this.throwIfDuplicateThresholdAmounts(thresholds);

    return await this.dataSource.transaction(async () => {
      await this.aidworkerAssignmentRepository.clearApproverAssignmentsForProgram(
        programId,
      );
      await this.programApprovalThresholdRepository.deleteThresholdsForProgram(
        programId,
      );

      const sortedThresholds: CreateProgramApprovalThresholdDto[] = thresholds
        .slice()
        .sort((a, b) => a.thresholdAmount - b.thresholdAmount);

      for (const thresholdDto of sortedThresholds) {
        await this.createThreshold({
          thresholdDto,
          programId,
        });
      }

      const thresholdsWithRelations =
        await this.programApprovalThresholdRepository.findThresholdsWithRelations(
          programId,
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

  private async createThreshold({
    thresholdDto,
    programId,
  }: {
    thresholdDto: CreateProgramApprovalThresholdDto;
    programId: number;
  }): Promise<void> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = thresholdDto.thresholdAmount;
    threshold.programId = programId;

    const savedThreshold =
      await this.programApprovalThresholdRepository.saveThreshold(threshold);

    if (thresholdDto.approvers && thresholdDto.approvers.length > 0) {
      for (const approverDto of thresholdDto.approvers) {
        await this.assignApproversToThreshold({
          approverDto,
          programId,
          savedThreshold,
        });
      }
    }
  }

  private async assignApproversToThreshold({
    approverDto,
    programId,
    savedThreshold,
  }: {
    approverDto: CreateApproverForThresholdDto;
    programId: number;
    savedThreshold: ProgramApprovalThresholdEntity;
  }): Promise<void> {
    const aidworker = await this.aidworkerAssignmentRepository.findById({
      id: approverDto.programAidworkerAssignmentId,
      programId,
    });

    if (!aidworker) {
      throw new HttpException(
        `Program aidworker assignment with ID ${approverDto.programAidworkerAssignmentId} not found for program ${programId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (aidworker.scope) {
      throw new HttpException(
        `Only users without scope can be made approvers. Program aidworker assignment ${approverDto.programAidworkerAssignmentId} has a scope.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (aidworker.programApprovalThresholdId !== null) {
      const thresholdAmount =
        aidworker.programApprovalThresholdId === savedThreshold.id
          ? savedThreshold.thresholdAmount
          : await this.programApprovalThresholdRepository.getThresholdAmount(
              aidworker.programApprovalThresholdId,
            );

      throw new HttpException(
        `Program aidworker assignment ${approverDto.programAidworkerAssignmentId} is already an approver for threshold with amount ${thresholdAmount}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    aidworker.programApprovalThresholdId = savedThreshold.id;
    await this.aidworkerAssignmentRepository.save(aidworker);
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
        .map((assignment, index) => ({
          id: assignment.id,
          userId: assignment.user?.id ?? null,
          username: assignment.user?.username ?? null,
          order: index + 1,
        })),
    };
  }
}

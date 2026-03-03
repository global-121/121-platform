import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CreateApproverForThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-approver-for-threshold.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';

@Injectable()
export class ProgramApprovalThresholdsService {
  public constructor(
    private readonly programApprovalThresholdRepository: ProgramApprovalThresholdRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  public async replaceProgramApprovalThresholds(
    programId: number,
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    this.throwIfDuplicateThresholdAmounts(thresholds);

    const thresholdsWithRelations = await this.dataSource.transaction(
      async (manager) => {
        const repository = manager.withRepository(
          this.programApprovalThresholdRepository,
        );

        await repository.clearApproverAssignmentsForProgram(programId);
        await repository.deleteThresholdsForProgram(programId);

        const sortedThresholds: CreateProgramApprovalThresholdDto[] = thresholds
          .slice()
          .sort((a, b) => a.thresholdAmount - b.thresholdAmount);

        for (const thresholdDto of sortedThresholds) {
          await this.createThreshold({
            repository,
            thresholdDto,
            programId,
          });
        }

        return await repository.findThresholdsWithRelations(programId);
      },
    );

    return thresholdsWithRelations.map((threshold) =>
      this.mapEntityToDto(threshold),
    );
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
    repository,
    thresholdDto,
    programId,
  }: {
    repository: ProgramApprovalThresholdRepository;
    thresholdDto: CreateProgramApprovalThresholdDto;
    programId: number;
  }): Promise<void> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = thresholdDto.thresholdAmount;
    threshold.programId = programId;

    const savedThreshold = await repository.saveThreshold(threshold);

    if (thresholdDto.approvers && thresholdDto.approvers.length > 0) {
      for (const approverDto of thresholdDto.approvers) {
        await this.assignApproversToThreshold({
          repository,
          approverDto,
          programId,
          savedThreshold,
        });
      }
    }
  }

  private async assignApproversToThreshold({
    repository,
    approverDto,
    programId,
    savedThreshold,
  }: {
    repository: ProgramApprovalThresholdRepository;
    approverDto: CreateApproverForThresholdDto;
    programId: number;
    savedThreshold: ProgramApprovalThresholdEntity;
  }): Promise<void> {
    const aidworker = await repository.findAidworkerAssignment(
      approverDto.programAidworkerAssignmentId,
      programId,
    );

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
          : await repository.getThresholdAmount(
              aidworker.programApprovalThresholdId,
            );

      throw new HttpException(
        `Program aidworker assignment ${approverDto.programAidworkerAssignmentId} is already an approver for threshold with amount ${thresholdAmount}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    aidworker.programApprovalThresholdId = savedThreshold.id;
    await repository.updateAidworkerAssignment(aidworker);
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
      created: entity.created,
      updated: entity.updated,
      approvers: (entity.approverAssignments || [])
        .sort((a, b) => a.id - b.id) // Sort by ID for consistent ordering
        .map((assignment, index) => ({
          id: assignment.id,
          userId: assignment.user?.id || 0,
          username: assignment.user?.username || 'Unknown',
          order: index + 1,
        })),
    };
  }
}

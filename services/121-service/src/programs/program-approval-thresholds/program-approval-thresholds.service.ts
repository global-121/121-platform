import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';

@Injectable()
export class ProgramApprovalThresholdsService {
  public constructor(
    private readonly programApprovalThresholdRepository: ProgramApprovalThresholdRepository,
  ) {}

  public async replaceProgramApprovalThresholds(
    programId: number,
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    // Validate that all thresholdAmounts are unique
    const thresholdAmounts = thresholds.map((t) => t.thresholdAmount);
    const uniqueAmounts = new Set(thresholdAmounts);
    if (thresholdAmounts.length !== uniqueAmounts.size) {
      throw new HttpException(
        'Threshold amounts must be unique. Cannot have multiple thresholds with the same amount.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const thresholdsWithRelations =
      await this.programApprovalThresholdRepository.replaceProgramApprovalThresholdsTransaction(
        programId,
        thresholds,
      );

    return thresholdsWithRelations.map((threshold) =>
      this.mapEntityToDto(threshold),
    );
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

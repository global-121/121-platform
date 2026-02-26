import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, Equal, IsNull, LessThanOrEqual, Not } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
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
    // Validate that all thresholdAmounts are unique
    const thresholdAmounts = thresholds.map((t) => t.thresholdAmount);
    const uniqueAmounts = new Set(thresholdAmounts);
    if (thresholdAmounts.length !== uniqueAmounts.size) {
      throw new HttpException(
        'Threshold amounts must be unique. Cannot have multiple thresholds with the same amount.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // First, clear any existing approver assignments for this program
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

      // Delete all existing thresholds for this program; related PaymentApprovals are retained and their
      // programApprovalThresholdId is set to NULL via the ON DELETE SET NULL foreign key constraint
      await manager.delete(ProgramApprovalThresholdEntity, {
        programId: Equal(programId),
      });

      // Sort thresholds by amount to determine approval levels
      const sortedThresholds = thresholds
        .slice()
        .sort((a, b) => a.thresholdAmount - b.thresholdAmount);

      for (const thresholdDto of sortedThresholds) {
        // Create threshold
        const threshold = new ProgramApprovalThresholdEntity();
        threshold.thresholdAmount = thresholdDto.thresholdAmount;
        threshold.programId = programId;

        const savedThreshold = await manager.save(
          ProgramApprovalThresholdEntity,
          threshold,
        );

        // Assign approvers if provided
        if (thresholdDto.approvers && thresholdDto.approvers.length > 0) {
          for (const approverDto of thresholdDto.approvers) {
            // Validate that the aidworker assignment exists and belongs to this program
            const assignment = await manager.findOne(
              ProgramAidworkerAssignmentEntity,
              {
                where: {
                  id: Equal(approverDto.programAidworkerAssignmentId),
                  programId: Equal(programId),
                },
              },
            );

            if (!assignment) {
              throw new HttpException(
                `Program aidworker assignment with ID ${approverDto.programAidworkerAssignmentId} not found for program ${programId}`,
                HttpStatus.BAD_REQUEST,
              );
            }

            if (assignment.scope !== '') {
              throw new HttpException(
                `Only users without scope can be made approvers. Program aidworker assignment ${approverDto.programAidworkerAssignmentId} has a scope.`,
                HttpStatus.BAD_REQUEST,
              );
            }

            // Check if this assignment is already an approver for this threshold
            if (assignment.programApprovalThresholdId === savedThreshold.id) {
              throw new HttpException(
                `Program aidworker assignment ${approverDto.programAidworkerAssignmentId} is already an approver for this threshold`,
                HttpStatus.BAD_REQUEST,
              );
            }

            // Check if this assignment is already an approver for a different threshold
            if (assignment.programApprovalThresholdId !== null) {
              throw new HttpException(
                `Program aidworker assignment ${approverDto.programAidworkerAssignmentId} is already an approver for another threshold`,
                HttpStatus.BAD_REQUEST,
              );
            }

            // Update the assignment to make it an approver
            assignment.programApprovalThresholdId = savedThreshold.id;
            await manager.save(ProgramAidworkerAssignmentEntity, assignment);
          }
        }
      }

      // Re-query all thresholds with their relations to build accurate response
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

  // Internal helper for seed data - creates a single threshold without approvers
  public async createProgramApprovalThreshold(
    programId: number,
    createDto: CreateProgramApprovalThresholdDto,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = createDto.thresholdAmount;
    threshold.programId = programId;

    const savedThreshold =
      await this.programApprovalThresholdRepository.save(threshold);

    return this.mapEntityToDto(savedThreshold);
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

  public async deleteAllProgramApprovalThresholds(
    programId: number,
  ): Promise<void> {
    await this.programApprovalThresholdRepository.delete({
      programId: Equal(programId),
    });
  }

  public async getThresholdsForPaymentAmount(
    programId: number,
    paymentAmount: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    const thresholds = await this.programApprovalThresholdRepository.find({
      where: {
        programId: Equal(programId),
        thresholdAmount: LessThanOrEqual(paymentAmount),
      },
      order: { thresholdAmount: 'ASC' },
    });
    return thresholds;
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
          order: index + 1, // Compute order from array position
        })),
    };
  }
}

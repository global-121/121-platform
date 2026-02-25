import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, LessThanOrEqual, Repository } from 'typeorm';

import { ApproverEntity } from '@121-service/src/programs/approver/entities/approver.entity';
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
    @InjectRepository(ApproverEntity)
    private readonly approverRepository: Repository<ApproverEntity>,
    @InjectRepository(ProgramAidworkerAssignmentEntity)
    private readonly aidworkerAssignmentRepository: Repository<ProgramAidworkerAssignmentEntity>,
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
      // Delete all existing thresholds for this program (CASCADE will delete approvers)
      await manager.delete(ProgramApprovalThresholdEntity, {
        programId: Equal(programId),
      });

      const results: GetProgramApprovalThresholdResponseDto[] = [];

      for (const thresholdDto of thresholds) {
        // Create threshold
        const threshold = new ProgramApprovalThresholdEntity();
        threshold.thresholdAmount = thresholdDto.thresholdAmount;
        threshold.approvalLevel = thresholdDto.approvalLevel;
        threshold.programId = programId;

        const savedThreshold = await manager.save(
          ProgramApprovalThresholdEntity,
          threshold,
        );

        // Create approvers if provided
        if (thresholdDto.approvers && thresholdDto.approvers.length > 0) {
          for (let i = 0; i < thresholdDto.approvers.length; i++) {
            const approverDto = thresholdDto.approvers[i];

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
            const existingApprover = await manager.findOne(ApproverEntity, {
              where: {
                programAidworkerAssignmentId: Equal(
                  approverDto.programAidworkerAssignmentId,
                ),
                programApprovalThresholdId: Equal(savedThreshold.id),
              },
            });

            if (existingApprover) {
              throw new HttpException(
                `Program aidworker assignment ${approverDto.programAidworkerAssignmentId} is already an approver for this threshold`,
                HttpStatus.BAD_REQUEST,
              );
            }

            // Create the approver
            const approver = new ApproverEntity();
            approver.programAidworkerAssignmentId =
              approverDto.programAidworkerAssignmentId;
            approver.programApprovalThresholdId = savedThreshold.id;
            approver.order = i + 1; // Order starts from 1

            await manager.save(ApproverEntity, approver);
          }
        }

        results.push(this.mapEntityToDto(savedThreshold));
      }

      return results;
    });
  }

  // Internal helper for seed data - creates a single threshold without approvers
  public async createProgramApprovalThreshold(
    programId: number,
    createDto: CreateProgramApprovalThresholdDto,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = createDto.thresholdAmount;
    threshold.approvalLevel = createDto.approvalLevel;
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
      order: { approvalLevel: 'ASC' },
      relations: {
        approvers: {
          programAidworkerAssignment: {
            user: true,
          },
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
      order: { approvalLevel: 'ASC' },
    });
    return thresholds;
  }

  private mapEntityToDto(
    entity: ProgramApprovalThresholdEntity,
  ): GetProgramApprovalThresholdResponseDto {
    return {
      id: entity.id,
      thresholdAmount: entity.thresholdAmount,
      approvalLevel: entity.approvalLevel,
      programId: entity.programId,
      created: entity.created,
      updated: entity.updated,
      approvers: (entity.approvers || [])
        .sort((a, b) => a.order - b.order)
        .map((approver) => ({
          id: approver.id,
          userId: approver.programAidworkerAssignment?.user?.id || 0,
          username:
            approver.programAidworkerAssignment?.user?.username || 'Unknown',
          order: approver.order,
        })),
    };
  }
}

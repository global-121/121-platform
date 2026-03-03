import { HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Equal,
  IsNull,
  LessThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

export class ProgramApprovalThresholdRepository extends Repository<ProgramApprovalThresholdEntity> {
  constructor(
    @InjectRepository(ProgramApprovalThresholdEntity)
    private readonly repository: Repository<ProgramApprovalThresholdEntity>,
    private readonly dataSource: DataSource,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async replaceProgramApprovalThresholdsTransaction(
    programId: number,
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.dataSource.transaction(async (manager) => {
      // Clear any existing approver assignments for this program
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
      return await manager.find(ProgramApprovalThresholdEntity, {
        where: { programId: Equal(programId) },
        relations: {
          approverAssignments: {
            user: true,
          },
        },
        order: { thresholdAmount: 'ASC' },
      });
    });
  }

  public async getThresholdsForPaymentAmount(
    programId: number,
    paymentAmount: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.find({
      where: {
        programId: Equal(programId),
        thresholdAmount: LessThanOrEqual(paymentAmount),
      },
      relations: ['approverAssignments'],
      order: { thresholdAmount: 'ASC' },
    });
  }

  public async getProgramApprovalThresholds(
    programId: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.find({
      where: { programId: Equal(programId) },
      order: { thresholdAmount: 'ASC' },
      relations: {
        approverAssignments: {
          user: true,
        },
      },
    });
  }
}

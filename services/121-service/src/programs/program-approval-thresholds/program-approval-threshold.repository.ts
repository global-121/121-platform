import { InjectRepository } from '@nestjs/typeorm';
import { Equal, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

export class ProgramApprovalThresholdRepository extends Repository<ProgramApprovalThresholdEntity> {
  constructor(
    @InjectRepository(ProgramApprovalThresholdEntity)
    private readonly repository: Repository<ProgramApprovalThresholdEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async clearApproverAssignmentsForProgram(
    programId: number,
  ): Promise<void> {
    await this.manager.update(
      ProgramAidworkerAssignmentEntity,
      {
        programId: Equal(programId),
        programApprovalThresholdId: Not(IsNull()),
      },
      {
        programApprovalThresholdId: null,
      },
    );
  }

  public async deleteThresholdsForProgram(programId: number): Promise<void> {
    await this.manager.delete(ProgramApprovalThresholdEntity, {
      programId: Equal(programId),
    });
  }

  public async saveThreshold(
    threshold: ProgramApprovalThresholdEntity,
  ): Promise<ProgramApprovalThresholdEntity> {
    return await this.manager.save(ProgramApprovalThresholdEntity, threshold);
  }

  public async findAidworkerAssignment(
    programAidworkerAssignmentId: number,
    programId: number,
  ): Promise<ProgramAidworkerAssignmentEntity | null> {
    return await this.manager.findOne(ProgramAidworkerAssignmentEntity, {
      where: {
        id: Equal(programAidworkerAssignmentId),
        programId: Equal(programId),
      },
    });
  }

  public async updateAidworkerAssignment(
    assignment: ProgramAidworkerAssignmentEntity,
  ): Promise<ProgramAidworkerAssignmentEntity> {
    return await this.manager.save(
      ProgramAidworkerAssignmentEntity,
      assignment,
    );
  }

  public async getThresholdAmount(thresholdId: number): Promise<number | null> {
    const threshold = await this.findOne({
      where: { id: Equal(thresholdId) },
      select: ['thresholdAmount'],
    });
    return threshold?.thresholdAmount ?? null;
  }

  public async findThresholdsWithRelations(
    programId: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.manager.find(ProgramApprovalThresholdEntity, {
      where: { programId: Equal(programId) },
      relations: {
        approverAssignments: {
          user: true,
        },
      },
      order: { thresholdAmount: 'ASC' },
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

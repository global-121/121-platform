import { InjectRepository } from '@nestjs/typeorm';
import { Equal, IsNull, Not, Repository } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';

export class ProgramAidworkerAssignmentRepository extends Repository<ProgramAidworkerAssignmentEntity> {
  constructor(
    @InjectRepository(ProgramAidworkerAssignmentEntity)
    private readonly baseRepository: Repository<ProgramAidworkerAssignmentEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findByUserId({
    userId,
    programId,
  }: {
    userId: number;
    programId: number;
  }): Promise<ProgramAidworkerAssignmentEntity | null> {
    return await this.findOne({
      where: {
        userId: Equal(userId),
        programId: Equal(programId),
      },
    });
  }

  public async isApprover(assignmentId: number): Promise<boolean> {
    const assignment = await this.findOne({
      where: {
        id: Equal(assignmentId),
        programApprovalThresholdId: Not(IsNull()),
      },
    });
    return assignment !== null;
  }

  public async clearApproverAssignmentsForProgram(
    programId: number,
  ): Promise<void> {
    await this.update(
      {
        programId: Equal(programId),
        programApprovalThresholdId: Not(IsNull()),
      },
      {
        programApprovalThresholdId: null,
      },
    );
  }

  public async findById({
    id,
    programId,
  }: {
    id: number;
    programId: number;
  }): Promise<ProgramAidworkerAssignmentEntity | null> {
    return await this.findOne({
      where: {
        id: Equal(id),
        programId: Equal(programId),
      },
    });
  }
}

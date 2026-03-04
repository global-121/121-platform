import { Injectable } from '@nestjs/common';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';

@Injectable()
export class ProgramAidworkerAssignmentsService {
  constructor(
    private readonly programAidworkerAssignmentRepository: ProgramAidworkerAssignmentRepository,
  ) {}

  public async getAssignmentByUserIdAndProgramId({
    userId,
    programId,
  }: {
    userId: number;
    programId: number;
  }): Promise<ProgramAidworkerAssignmentEntity | null> {
    return await this.programAidworkerAssignmentRepository.findByUserIdAndProgramId(
      {
        userId,
        programId,
      },
    );
  }

  public async getAssignmentsByProgramId(
    programId: number,
  ): Promise<ProgramAidworkerAssignmentEntity[]> {
    return await this.programAidworkerAssignmentRepository.findByProgramId(
      programId,
    );
  }
}

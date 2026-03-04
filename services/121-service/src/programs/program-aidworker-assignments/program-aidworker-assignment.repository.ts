import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

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

  public async findByUserIdAndProgramId({
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

  public async findByProgramId(
    programId: number,
  ): Promise<ProgramAidworkerAssignmentEntity[]> {
    return await this.find({
      where: {
        programId: Equal(programId),
      },
      relations: ['user', 'roles'],
    });
  }
}

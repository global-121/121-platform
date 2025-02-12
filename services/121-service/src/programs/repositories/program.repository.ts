import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProjectEntity } from '@121-service/src/programs/project.entity';

export class ProgramRepository extends Repository<ProjectEntity> {
  constructor(
    @InjectRepository(ProjectEntity)
    private baseRepository: Repository<ProjectEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findByIdOrFail(id: number): Promise<ProjectEntity> {
    const program = await this.baseRepository.findOne({
      where: { id: Equal(id) },
    });
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }
    return program;
  }
}

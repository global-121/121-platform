import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';

export class ProjectRepository extends Repository<ProjectEntity> {
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
    const project = await this.baseRepository.findOne({
      where: { id: Equal(id) },
    });
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return project;
  }
}

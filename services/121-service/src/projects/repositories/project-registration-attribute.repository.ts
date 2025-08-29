import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export class ProjectRegistrationAttributeRepository extends Repository<ProjectRegistrationAttributeEntity> {
  constructor(
    @InjectRepository(ProjectRegistrationAttributeEntity)
    private repository: Repository<ProjectRegistrationAttributeEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async getDropdownAttributes({
    projectId,
    select,
  }: {
    projectId: number;
    select?: string[];
  }) {
    const where: Record<string, unknown> = {
      type: Equal(RegistrationAttributeTypes.dropdown),
      project: { id: Equal(projectId) },
    };
    if (select && select.length > 0) {
      where['name'] = In(select);
    }
    return await this.repository.find({
      where,
    });
  }
}

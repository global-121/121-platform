import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';

export class AccessGroupLevelRepository extends Repository<AccessGroupLevelEntity> {
  constructor(
    @InjectRepository(AccessGroupLevelEntity)
    private readonly baseRepository: Repository<AccessGroupLevelEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findOrderedAttributeNamesByProgramId({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    const accessGroupLevels = await this.find({
      where: { programId: Equal(programId) },
      relations: { programRegistrationAttribute: true },
      order: { level: 'ASC' },
    });

    return accessGroupLevels.map(
      (accessGroupLevel) => accessGroupLevel.programRegistrationAttribute.name,
    );
  }

  public async getIdsByAttributeNames({
    programId,
    attributeNames,
  }: {
    programId: number;
    attributeNames: string[];
  }): Promise<Map<string, number>> {
    const accessGroupLevels = await this.find({
      where: {
        programId: Equal(programId),
        programRegistrationAttribute: { name: In(attributeNames) },
      },
      relations: { programRegistrationAttribute: true },
    });

    return new Map(
      accessGroupLevels.map((accessGroupLevel) => [
        accessGroupLevel.programRegistrationAttribute.name,
        accessGroupLevel.id,
      ]),
    );
  }
}

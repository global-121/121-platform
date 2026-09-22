import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

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
  }): Promise<string[] | null> {
    const accessGroupLevels = await this.find({
      where: { programId: Equal(programId) },
      relations: { programRegistrationAttribute: true },
      order: { level: 'ASC' },
    });

    if (accessGroupLevels.length === 0) {
      return null;
    }

    return accessGroupLevels.map(
      (accessGroupLevel) => accessGroupLevel.programRegistrationAttribute.name,
    );
  }

  public async replaceForProgram({
    programId,
    orderedProgramRegistrationAttributeIds,
  }: {
    programId: number;
    orderedProgramRegistrationAttributeIds: number[];
  }): Promise<void> {
    await this.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(AccessGroupLevelEntity, {
        programId: Equal(programId),
      });

      if (orderedProgramRegistrationAttributeIds.length === 0) {
        return;
      }

      const accessGroupLevels = orderedProgramRegistrationAttributeIds.map(
        (programRegistrationAttributeId, level) =>
          transactionalEntityManager.create(AccessGroupLevelEntity, {
            programId,
            programRegistrationAttributeId,
            level,
          }),
      );
      await transactionalEntityManager.save(accessGroupLevels);
    });
  }
}

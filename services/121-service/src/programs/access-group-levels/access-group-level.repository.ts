import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';
import { AccessGroupLevelAttribute } from '@121-service/src/programs/access-group-levels/interfaces/access-group-level-attribute.interface';

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

  public async getOrderedAttributeNamesByProgramId({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    const attributes = await this.getOrderedAttributesByProgramId({
      programId,
    });

    return attributes.map(({ name }) => name);
  }

  public async getOrderedAttributesByProgramId({
    programId,
  }: {
    programId: number;
  }): Promise<AccessGroupLevelAttribute[]> {
    const accessGroupLevels = await this.find({
      where: { programId: Equal(programId) },
      relations: { programRegistrationAttribute: true },
      order: { level: 'ASC' },
    });

    return accessGroupLevels.map(({ programRegistrationAttribute }) => ({
      programRegistrationAttributeId: programRegistrationAttribute.id,
      name: programRegistrationAttribute.name,
      optionValues: new Set(
        (programRegistrationAttribute.options ?? []).map(
          ({ option }) => option,
        ),
      ),
    }));
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

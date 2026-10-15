import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ReplaceAccessGroupsForAssignmentParams } from '@121-service/src/programs/program-aidworker-assignments/interfaces/replace-access-groups-for-assignment-params.interface';
import { ProgramAidworkerAssignmentAccessGroupEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.entity';

export class ProgramAidworkerAssignmentAccessGroupRepository extends Repository<ProgramAidworkerAssignmentAccessGroupEntity> {
  constructor(
    @InjectRepository(ProgramAidworkerAssignmentAccessGroupEntity)
    private readonly baseRepository: Repository<ProgramAidworkerAssignmentAccessGroupEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async replaceForAssignment({
    programAidworkerAssignmentId,
    accessGroups,
  }: ReplaceAccessGroupsForAssignmentParams): Promise<void> {
    await this.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(
        ProgramAidworkerAssignmentAccessGroupEntity,
        { programAidworkerAssignmentId: Equal(programAidworkerAssignmentId) },
      );

      if (accessGroups.length === 0) {
        return;
      }

      const accessGroupEntities = accessGroups.map((accessGroup) =>
        transactionalEntityManager.create(
          ProgramAidworkerAssignmentAccessGroupEntity,
          { programAidworkerAssignmentId, ...accessGroup },
        ),
      );
      await transactionalEntityManager.save(accessGroupEntities);
    });
  }
}

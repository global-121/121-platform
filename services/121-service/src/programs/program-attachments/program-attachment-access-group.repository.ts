import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ProgramAttachmentAccessGroupEntity } from '@121-service/src/programs/program-attachments/program-attachment-access-group.entity';

export class ProgramAttachmentAccessGroupRepository extends Repository<ProgramAttachmentAccessGroupEntity> {
  constructor(
    @InjectRepository(ProgramAttachmentAccessGroupEntity)
    private readonly baseRepository: Repository<ProgramAttachmentAccessGroupEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getAccessGroupLevelIdsInUse({
    accessGroupLevelIds,
  }: {
    accessGroupLevelIds: number[];
  }): Promise<Set<number>> {
    if (accessGroupLevelIds.length === 0) {
      return new Set();
    }

    const accessGroups = await this.find({
      where: { accessGroupLevelId: In(accessGroupLevelIds) },
      select: { accessGroupLevelId: true },
    });

    return new Set(
      accessGroups.map(({ accessGroupLevelId }) => accessGroupLevelId),
    );
  }
}

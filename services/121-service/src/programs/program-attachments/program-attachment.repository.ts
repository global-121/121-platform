import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindManyOptions, Like, Repository } from 'typeorm';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';

export class ProgramAttachmentRepository extends Repository<ProgramAttachmentEntity> {
  constructor(
    @InjectRepository(ProgramAttachmentEntity)
    private readonly repository: Repository<ProgramAttachmentEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findManyScoped({
    programId,
    scope,
    relations,
  }: {
    programId: number;
    scope: string;
    relations?: FindManyOptions<ProgramAttachmentEntity>['relations'];
  }): Promise<ProgramAttachmentEntity[]> {
    return this.find({
      where: [
        { programId: Equal(programId), scope: Like(`${scope}%`) },
        { programId: Equal(programId), program: { enableScope: false } },
      ],
      relations,
    });
  }

  public findOneScoped({
    programId,
    attachmentId,
    scope,
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
  }): Promise<ProgramAttachmentEntity | null> {
    return this.findOne({
      where: [
        {
          programId: Equal(programId),
          id: Equal(attachmentId),
          scope: Like(`${scope}%`),
        },
        {
          programId: Equal(programId),
          id: Equal(attachmentId),
          program: { enableScope: false },
        },
      ],
    });
  }
}

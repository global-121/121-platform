import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindManyOptions, Repository } from 'typeorm';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { convertToScopedOptions } from '@121-service/src/utils/scope/createFindWhereOptions.helper';

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
    return this.find(
      convertToScopedOptions<
        ProgramAttachmentEntity,
        FindManyOptions<ProgramAttachmentEntity>
      >({ where: { programId: Equal(programId) }, relations }, [], scope),
    );
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
    return this.findOne(
      convertToScopedOptions<
        ProgramAttachmentEntity,
        FindManyOptions<ProgramAttachmentEntity>
      >(
        { where: { programId: Equal(programId), id: Equal(attachmentId) } },
        [],
        scope,
      ),
    );
  }
}

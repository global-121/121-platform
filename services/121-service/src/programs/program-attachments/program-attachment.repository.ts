import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository, SelectQueryBuilder } from 'typeorm';

import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { addProgramAttachmentAccessGroupFilter } from '@121-service/src/programs/program-attachments/program-attachment-access-group-filter.helper';

export class ProgramAttachmentRepository extends Repository<ProgramAttachmentEntity> {
  constructor(
    @InjectRepository(ProgramAttachmentEntity)
    private readonly repository: Repository<ProgramAttachmentEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createWithAccessGroups({
    programId,
    userId,
    filename,
    mimetype,
    blobName,
    scope,
    accessGroups,
  }: {
    programId: number;
    userId: number;
    filename: string;
    mimetype: string;
    blobName: string;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<number> {
    const savedAttachment = await this.save(
      this.create({
        programId,
        userId,
        filename,
        mimetype,
        blobName,
        scope,
        accessGroups: accessGroups.map(({ accessGroupLevelId, value }) => ({
          accessGroupLevelId,
          value,
        })),
      }),
    );

    return savedAttachment.id;
  }

  public getManyAccessible({
    programId,
    scope,
    accessGroups,
  }: {
    programId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<ProgramAttachmentEntity[]> {
    return this.createAccessibleQuery({
      programId,
      scope,
      accessGroups,
    }).getMany();
  }

  public getOneAccessible({
    programId,
    attachmentId,
    scope,
    accessGroups,
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<ProgramAttachmentEntity | null> {
    return this.createAccessibleQuery({ programId, scope, accessGroups })
      .andWhere('"attachment"."id" = :attachmentId', { attachmentId })
      .getOne();
  }

  public async updateFilename({
    attachmentId,
    filename,
  }: {
    attachmentId: number;
    filename: string;
  }): Promise<void> {
    await this.update({ id: Equal(attachmentId) }, { filename });
  }

  public async deleteById({
    attachmentId,
  }: {
    attachmentId: number;
  }): Promise<void> {
    await this.delete({ id: Equal(attachmentId) });
  }

  // Both the scope and the access groups have to match: disabling the scope of a program does not disable filtering by access groups
  private createAccessibleQuery({
    programId,
    scope,
    accessGroups,
  }: {
    programId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): SelectQueryBuilder<ProgramAttachmentEntity> {
    const queryBuilder = this.createQueryBuilder('attachment')
      .leftJoin('attachment.user', 'user')
      .addSelect(['user.id', 'user.username'])
      .leftJoin('attachment.accessGroups', 'accessGroup')
      .leftJoin('accessGroup.accessGroupLevel', 'accessGroupLevel')
      .leftJoin(
        'accessGroupLevel.programRegistrationAttribute',
        'accessGroupAttribute',
      )
      .addSelect([
        'accessGroup.id',
        'accessGroup.value',
        'accessGroupLevel.id',
        'accessGroupLevel.level',
        'accessGroupAttribute.id',
        'accessGroupAttribute.name',
      ])
      .where('"attachment"."programId" = :programId', { programId })
      .orderBy('attachment.id', 'ASC')
      .addOrderBy('accessGroupLevel.level', 'ASC');

    this.addScopeFilter({ queryBuilder, scope });

    addProgramAttachmentAccessGroupFilter({
      queryBuilder,
      attachmentAlias: 'attachment',
      accessGroups,
    });

    return queryBuilder;
  }

  private addScopeFilter({
    queryBuilder,
    scope,
  }: {
    queryBuilder: SelectQueryBuilder<ProgramAttachmentEntity>;
    scope: string;
  }): void {
    queryBuilder
      .innerJoin('attachment.program', 'program')
      .andWhere(
        '("program"."enableScope" = false OR "attachment"."scope" LIKE :scope)',
        { scope: `${scope}%` },
      );
  }
}

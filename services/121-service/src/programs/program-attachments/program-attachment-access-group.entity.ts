import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';

// One row per access group level of the uploader at the time of uploading, so later changes to the uploader's assignment do not change who can access the attachment.
@Unique('programAttachmentAccessGroupUnique', [
  'programAttachmentId',
  'accessGroupLevelId',
])
@Index('IDX_program_attachment_access_group_levelId', ['accessGroupLevelId'])
@Entity('program_attachment_access_group')
export class ProgramAttachmentAccessGroupEntity extends Base121Entity {
  @ManyToOne(
    () => ProgramAttachmentEntity,
    (programAttachment) => programAttachment.accessGroups,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'programAttachmentId' })
  public programAttachment: Relation<ProgramAttachmentEntity>;
  @Column()
  public programAttachmentId: number;

  // Removing a level must not silently remove the access group of an attachment; the access group levels service prevents this with a clear error.
  @ManyToOne(() => AccessGroupLevelEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'accessGroupLevelId' })
  public accessGroupLevel: Relation<AccessGroupLevelEntity>;
  @Column()
  public accessGroupLevelId: number;

  @Column()
  public value: string;
}

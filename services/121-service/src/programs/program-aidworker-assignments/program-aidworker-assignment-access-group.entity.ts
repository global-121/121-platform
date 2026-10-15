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
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';

// One row per access group level an aid worker is restricted to: the configured level and the value the aid worker may see.
@Unique('programAidworkerAssignmentAccessGroupUnique', [
  'programAidworkerAssignmentId',
  'accessGroupLevelId',
])
@Index('IDX_program_aidworker_assignment_access_group_levelId', [
  'accessGroupLevelId',
])
@Entity('program_aidworker_assignment_access_group')
export class ProgramAidworkerAssignmentAccessGroupEntity extends Base121Entity {
  @ManyToOne(
    () => ProgramAidworkerAssignmentEntity,
    (programAidworkerAssignment) => programAidworkerAssignment.accessGroups,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'programAidworkerAssignmentId' })
  public programAidworkerAssignment: Relation<ProgramAidworkerAssignmentEntity>;
  @Column()
  public programAidworkerAssignmentId: number;

  @ManyToOne(() => AccessGroupLevelEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accessGroupLevelId' })
  public accessGroupLevel: Relation<AccessGroupLevelEntity>;
  @Column()
  public accessGroupLevelId: number;

  @Column()
  public value: string;
}

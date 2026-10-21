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
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';

// One row per access group level an aid worker is restricted to: the registration attribute that defines the level and the value the aid worker may see.
@Unique('programAidworkerAssignmentAccessGroupUnique', [
  'programAidworkerAssignmentId',
  'programRegistrationAttributeId',
])
@Index('IDX_program_aidworker_assignment_access_group_attributeId_value', [
  'programRegistrationAttributeId',
  'value',
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

  @ManyToOne(() => ProgramRegistrationAttributeEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'programRegistrationAttributeId' })
  public programRegistrationAttribute: Relation<ProgramRegistrationAttributeEntity>;
  @Column()
  public programRegistrationAttributeId: number;

  @Column()
  public value: string;
}

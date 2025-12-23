import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';

@Entity('approver')
export class ApproverEntity extends Base121Entity {
  @OneToOne(() => ProgramAidworkerAssignmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programAidworkerAssignmentId' })
  public programAidworkerAssignment: Relation<ProgramAidworkerAssignmentEntity>;
  @Column()
  public programAidworkerAssignmentId: number;

  // TODO: for now we don't enforce uniqueness per program. If equal, sort by username.
  @Column()
  public order: number;
}

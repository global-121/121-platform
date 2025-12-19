import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';

// ##TODO: name? program-approver? program-payment-approver?
@Entity('approver')
export class ApproverEntity extends Base121Entity {
  @OneToOne(() => ProgramAidworkerAssignmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programAidworkerAssignmentId' })
  public programAidworkerAssignment: Relation<ProgramAidworkerAssignmentEntity>;
  @Column()
  public programAidworkerAssignmentId: number;

  // ##TODO: we want this unique per program, but that is not in this entity.
  @Column()
  public order: number;
}

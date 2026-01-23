import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';

@Entity('approver')
export class ApproverEntity extends Base121Entity {
  @OneToOne(() => ProgramAidworkerAssignmentEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'programAidworkerAssignmentId' })
  public programAidworkerAssignment: Relation<ProgramAidworkerAssignmentEntity>;
  @Column({ nullable: true })
  public programAidworkerAssignmentId: number;

  @Column()
  public order: number;

  @Column()
  public isActive: boolean;
}

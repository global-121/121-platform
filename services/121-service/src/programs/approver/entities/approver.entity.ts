import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

@Entity('approver')
export class ApproverEntity extends Base121Entity {
  @OneToOne(() => ProgramAidworkerAssignmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programAidworkerAssignmentId' })
  public programAidworkerAssignment: Relation<ProgramAidworkerAssignmentEntity>;
  @Column()
  public programAidworkerAssignmentId: number;

  @ManyToOne(
    () => ProgramApprovalThresholdEntity,
    (threshold) => threshold.approvers,
    { onDelete: 'CASCADE', nullable: true },
  )
  @JoinColumn({
    name: 'programApprovalThresholdId',
    foreignKeyConstraintName: 'FK_approver_program_approval_threshold',
  })
  public programApprovalThreshold: Relation<ProgramApprovalThresholdEntity> | null;
  @Column({ nullable: true })
  public programApprovalThresholdId: number | null;

  @Column()
  public order: number;
}

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentApprovalEntity } from '@121-service/src/payments/entities/payment-approval.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';

@Entity('program_approval_threshold')
export class ProgramApprovalThresholdEntity extends Base121Entity {
  @ManyToOne(() => ProgramEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'programId',
    foreignKeyConstraintName: 'FK_program_approval_threshold_program',
  })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  public thresholdAmount: number;

  @Column()
  public approvalLevel: number;

  @OneToMany(
    () => ProgramAidworkerAssignmentEntity,
    (assignment) => assignment.programApprovalThreshold,
  )
  public approverAssignments: Relation<ProgramAidworkerAssignmentEntity[]>;

  @OneToMany(
    () => PaymentApprovalEntity,
    (paymentApproval) => paymentApproval.programApprovalThreshold,
  )
  public paymentApprovals: Relation<PaymentApprovalEntity[]>;
}

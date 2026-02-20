import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentApprovalEntity } from '@121-service/src/payments/entities/payment-approval.entity';
import { ApproverEntity } from '@121-service/src/programs/approvers/entities/approver.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Entity('program_approval_threshold')
export class ProgramApprovalThresholdEntity extends Base121Entity {
  @ManyToOne(() => ProgramEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  public thresholdAmount: number;

  @Column()
  public approvalLevel: number;

  @OneToMany(
    () => ApproverEntity,
    (approver) => approver.programAidworkerAssignment,
  )
  public approvers: Relation<ApproverEntity[]>;

  @OneToOne(() => PaymentApprovalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentApprovalId' })
  public paymentApproval: Relation<PaymentApprovalEntity>;
  @Column({ nullable: true })
  public paymentApprovalId: number | null;
}

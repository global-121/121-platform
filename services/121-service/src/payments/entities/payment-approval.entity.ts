import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('payment_approval')
export class PaymentApprovalEntity extends Base121Entity {
  @ManyToOne(
    () => ProgramApprovalThresholdEntity,
    (threshold) => threshold.paymentApprovals,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({
    name: 'programApprovalThresholdId',
    foreignKeyConstraintName: 'FK_payment_approval_program_approval_threshold',
  })
  public programApprovalThreshold: Relation<ProgramApprovalThresholdEntity> | null;
  @Column({ nullable: true })
  public programApprovalThresholdId: number | null;

  @ManyToOne(() => PaymentEntity, (payment) => payment.approvals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  public payment: Relation<PaymentEntity>;
  @Column()
  public paymentId: number;

  @Column()
  public approved: boolean;

  @Column()
  public rank: number;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'approvedByUserId',
    foreignKeyConstraintName: 'FK_payment_approval_approved_by_user',
  })
  public approvedByUser: Relation<UserEntity> | null;
  @Column({ type: 'integer', nullable: true })
  public approvedByUserId: number | null;
}

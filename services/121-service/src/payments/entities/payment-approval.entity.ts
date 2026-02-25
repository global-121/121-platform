import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

@Entity('payment_approval')
export class PaymentApprovalEntity extends Base121Entity {
  @ManyToOne(
    () => ProgramApprovalThresholdEntity,
    (threshold) => threshold.paymentApprovals,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'programApprovalThresholdId' })
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

  @Column({ type: 'integer', nullable: true })
  public approvedByUserId: number | null;
}

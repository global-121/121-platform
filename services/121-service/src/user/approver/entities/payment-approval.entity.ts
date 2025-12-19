import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ApproverEntity } from '@121-service/src/user/approver/entities/approver.entity';

@Entity('payment_approval')
export class PaymentApprovalEntity extends Base121Entity {
  @ManyToOne(() => ApproverEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approverId' })
  public approver: Relation<ApproverEntity>;
  @Column()
  public approverId: number;

  @ManyToOne(() => PaymentEntity, (payment) => payment.approvals, {
    onDelete: 'CASCADE',
  })
  public payment: Relation<PaymentEntity>;

  @Column({ default: false })
  public approved: boolean;
}

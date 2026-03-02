import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentApprovalAidworkerEntity } from '@121-service/src/payments/entities/payment-approval-aidworker.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('payment_approval')
export class PaymentApprovalEntity extends Base121Entity {
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

  @OneToMany(
    () => PaymentApprovalAidworkerEntity,
    (aidworker) => aidworker.paymentApproval,
  )
  public aidworkers: Relation<PaymentApprovalAidworkerEntity[]>;
}

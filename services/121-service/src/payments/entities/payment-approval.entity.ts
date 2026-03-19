import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('payment_approval')
export class PaymentApprovalEntity extends Base121Entity {
  @ManyToOne(() => PaymentEntity, (payment) => payment.approvals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  public payment!: Relation<PaymentEntity>;
  @Column()
  public paymentId!: number;

  @Column()
  public approved!: boolean;

  @Column()
  public rank!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'approvedByUserId',
    foreignKeyConstraintName: 'FK_payment_approval_approved_by_user',
  })
  public approvedByUser!: Relation<UserEntity> | null;
  @Column({ type: 'integer', nullable: true })
  public approvedByUserId!: number | null;

  @ManyToMany(() => ProgramAidworkerAssignmentEntity)
  @JoinTable({
    name: 'payment_approval_aidworker',
    joinColumn: {
      name: 'paymentApprovalId',
      foreignKeyConstraintName:
        'FK_payment_approval_aidworker_payment_approval',
    },
    inverseJoinColumn: {
      name: 'programAidworkerAssignmentId',
      foreignKeyConstraintName:
        'FK_payment_approval_aidworker_program_aidworker_assignment',
    },
  })
  public approverAssignments!: Relation<ProgramAidworkerAssignmentEntity[]>;
}

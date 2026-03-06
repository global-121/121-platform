import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentApprovalEntity } from '@121-service/src/payments/entities/payment-approval.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';

@Entity('payment_approval_aidworker')
export class PaymentApprovalAidworkerEntity extends Base121Entity {
  @ManyToOne(
    () => PaymentApprovalEntity,
    (paymentApproval) => paymentApproval.aidworkers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'paymentApprovalId',
    foreignKeyConstraintName: 'FK_payment_approval_aidworker_payment_approval',
  })
  public paymentApproval: Relation<PaymentApprovalEntity>;
  @Column()
  public paymentApprovalId: number;

  @ManyToOne(() => ProgramAidworkerAssignmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'programAidworkerAssignmentId',
    foreignKeyConstraintName:
      'FK_payment_approval_aidworker_program_aidworker_assignment',
  })
  public programAidworkerAssignment: Relation<ProgramAidworkerAssignmentEntity>;
  @Column()
  public programAidworkerAssignmentId: number;

  @Column()
  public order: number;
}

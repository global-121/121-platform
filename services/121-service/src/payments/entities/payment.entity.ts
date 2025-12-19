import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { PaymentApprovalEntity } from '@121-service/src/user/approver/entities/payment-approval.entity';

@Entity('payment')
export class PaymentEntity extends Base121Entity {
  @OneToMany(() => TransactionEntity, (transactions) => transactions.payment)
  public transactions: Relation<TransactionEntity[]>;

  @ManyToOne((_type) => ProgramEntity, (program) => program.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @OneToMany(() => PaymentApprovalEntity, (approval) => approval.payment, {
    cascade: true,
  })
  public approvals: PaymentApprovalEntity[];
}

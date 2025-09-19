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

@Entity('payment')
export class PaymentEntity extends Base121Entity {
  @OneToMany(() => TransactionEntity, (transactions) => transactions.paymentId)
  public transactions: Relation<TransactionEntity[]>;

  @ManyToOne((_type) => ProgramEntity, (program) => program.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;
}

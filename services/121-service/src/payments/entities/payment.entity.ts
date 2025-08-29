import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProjectEntity } from '@121-service/src/projects/project.entity';

@Entity('payment')
export class PaymentEntity extends Base121Entity {
  @OneToMany(() => TransactionEntity, (transactions) => transactions.paymentId)
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(
    () => LatestTransactionEntity,
    (latestTransactions) => latestTransactions.payment,
  )
  public latestTransactions: Relation<LatestTransactionEntity[]>;

  @ManyToOne((_type) => ProjectEntity, (project) => project.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  public project: Relation<ProjectEntity>;
  @Column()
  public projectId: number;
}

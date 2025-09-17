import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';

@Entity('last_transaction_event')
export class LastTransactionEventEntity extends Base121Entity {
  @OneToOne(
    (_type) => TransactionEntity,
    (transaction) => transaction.lastTransactionEvent,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'transactionId' })
  public transaction: Relation<TransactionEntity>;
  @Index()
  @Column({ type: 'int' })
  public transactionId: number;

  @OneToOne(() => TransactionEventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionEventId' })
  public transactionEvent: Relation<TransactionEventEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public transactionEventId: number;
}

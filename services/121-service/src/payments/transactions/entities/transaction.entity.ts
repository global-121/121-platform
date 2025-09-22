import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Unique(['registrationId', 'paymentId'])
@Entity('transaction')
export class TransactionEntity extends Base121Entity {
  @Column({ nullable: true, type: 'real' })
  public transferValue: number | null;

  @Column()
  @Index()
  public status: string;

  @ManyToOne((_type) => PaymentEntity, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  public payment: Relation<PaymentEntity>;
  @Index()
  @Column({ type: 'int' })
  public paymentId: number;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.transactions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public registrationId: number;

  @OneToMany(
    () => TransactionEventEntity,
    (transactionEvent) => transactionEvent.transaction,
  )
  public transactionEvents: Relation<TransactionEventEntity[]>;
}

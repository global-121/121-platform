import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

// This entity is used to store to link the lastest transaction for a payment to a registration

@Unique('registrationPaymentLatestTransactionUnique', [
  'registrationId',
  'payment',
])
@Entity('latest_transaction')
export class LatestTransactionEntity extends Base121Entity {
  @Column({ default: 1 })
  @Index()
  public payment: number;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.latestTransactions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public registrationId: number;

  @OneToOne(() => TransactionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  public transaction: Relation<TransactionEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}

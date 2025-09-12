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
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

// This entity is used to store to link the lastest transaction for a payment to a registration

@Unique('registrationPaymentLatestTransactionUnique', [
  'registrationId',
  'payment',
])
@Entity('latest_transaction')
export class LatestTransactionEntity extends Base121Entity {
  @ManyToOne(
    (_type) => PaymentEntity,
    (payment) => payment.latestTransactions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'paymentId',
  })
  public payment: Relation<PaymentEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public paymentId: number;

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

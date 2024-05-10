import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { TransactionEntity } from './transaction.entity';

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
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Index()
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transactionId' })
  public transaction: TransactionEntity;
  @Index()
  @Column({ type: 'int', nullable: true })
  public transactionId: number | null;
}

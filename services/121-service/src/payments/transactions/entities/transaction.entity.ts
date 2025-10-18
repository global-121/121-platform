import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { LastTransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/last-transaction-event.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Unique(['registrationId', 'paymentId'])
@Entity('transaction')
export class TransactionEntity extends Base121AuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

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
    { cascade: true },
  )
  public transactionEvents: Relation<TransactionEventEntity[]>;

  @OneToOne(
    () => LastTransactionEventEntity,
    (lastTransactionEvent) => lastTransactionEvent.transaction,
    { onDelete: 'NO ACTION' },
  )
  public lastTransactionEvent: Relation<LastTransactionEventEntity>;
}

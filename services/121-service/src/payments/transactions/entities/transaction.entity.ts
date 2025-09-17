import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';

import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/entities/latest-transaction.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/entities/transaction-event.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('transaction')
export class TransactionEntity extends Base121AuditedEntity {
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
    (_type) => ProgramFspConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.transactions,
    { onDelete: 'SET NULL' },
  )
  @JoinColumn({
    name: 'programFspConfigurationId',
  })
  public programFspConfiguration: Relation<ProgramFspConfigurationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true })
  public programFspConfigurationId: number;

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
    (transactionEvents) => transactionEvents.transactionId,
  )
  public transactionsEvents: Relation<TransactionEventEntity[]>;

  // ##TODO: refactor this out, but leave in for now to avoid breaking changes
  @OneToOne(
    () => LatestTransactionEntity,
    (latestTransaction) => latestTransaction.transaction,
    { onDelete: 'NO ACTION' },
  )
  public latestTransaction: Relation<LatestTransactionEntity>;
}

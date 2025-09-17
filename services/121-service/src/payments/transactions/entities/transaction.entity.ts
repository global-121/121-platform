import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Relation,
} from 'typeorm';

import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('transaction')
export class TransactionEntity extends Base121AuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @Column({ nullable: true, type: 'real' })
  public amount: number | null;

  @Column()
  @Index()
  public status: string;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;

  @ManyToOne((_type) => PaymentEntity, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'paymentId',
  })
  public payment: Relation<PaymentEntity>;
  @Index()
  @Column({ type: 'int' })
  public paymentId: number;

  @Column('json', {
    default: {},
  })
  public customData: Record<string, unknown>;

  @Column({ default: 1 })
  @Index()
  public transactionStep: number;

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

  @OneToOne(
    () => LatestTransactionEntity,
    (latestTransaction) => latestTransaction.transaction,
    { onDelete: 'NO ACTION' },
  )
  public latestTransaction: Relation<LatestTransactionEntity>;
}

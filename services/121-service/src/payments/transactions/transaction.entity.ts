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
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { UserEntity } from '@121-service/src/user/user.entity';

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
    (_type) => ProjectFspConfigurationEntity,
    (projectFspConfiguration) => projectFspConfiguration.transactions,
    { onDelete: 'SET NULL' },
  )
  @JoinColumn({
    name: 'projectFspConfigurationId',
  })
  public projectFspConfiguration: Relation<ProjectFspConfigurationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true })
  public projectFspConfigurationId: number;

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

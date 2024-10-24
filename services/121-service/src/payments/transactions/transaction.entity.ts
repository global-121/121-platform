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
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';

@Entity('transaction')
export class TransactionEntity extends Base121AuditedEntity {
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @Column({ nullable: true, type: 'real' })
  public amount: number | null;

  @Column()
  @Index()
  public status: string;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;

  @ManyToOne((_type) => ProgramEntity, (program) => program.transactions)
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Index()
  @Column({ type: 'int' })
  public programId: number;

  @Column({ default: 1 })
  @Index()
  public payment: number;

  @Column('json', {
    default: {},
  })
  public customData: Record<string, unknown>;

  @Column({ default: 1 })
  @Index()
  public transactionStep: number;

  @ManyToOne(
    (_type) => ProgramFinancialServiceProviderConfigurationEntity,
    (programFinancialServiceProviderConfiguration) =>
      programFinancialServiceProviderConfiguration.transactions,
  )
  @JoinColumn({
    name: 'programFinancialServiceProviderConfigurationId',
  })
  public programFinancialServiceProviderConfiguration: Relation<ProgramFinancialServiceProviderConfigurationEntity>;
  @Index()
  @Column({ type: 'int' })
  public programFinancialServiceProviderConfigurationId: number;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.transactions,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @OneToOne(
    () => LatestTransactionEntity,
    (latestTransaction) => latestTransaction.transaction,
  )
  public latestTransaction: Relation<LatestTransactionEntity>;
}

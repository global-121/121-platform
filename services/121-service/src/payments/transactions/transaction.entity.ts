import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Base121AuditedEntity } from '../../base-audited.entity';
import { FinancialServiceProviderEntity } from '../../financial-service-providers/financial-service-provider.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { UserEntity } from '../../user/user.entity';
import { LatestTransactionEntity } from './latest-transaction.entity';

@Entity('transaction')
export class TransactionEntity extends Base121AuditedEntity {
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  public user: UserEntity;

  @Column({ nullable: true, type: 'real' })
  public amount: number | null;

  @Column()
  @Index()
  public status: string;

  @Column({ nullable: true })
  public errorMessage: string | null;

  @ManyToOne((_type) => ProgramEntity, (program) => program.transactions)
  public program: ProgramEntity;

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
    (_type) => FinancialServiceProviderEntity,
    (financialServiceProvider) => financialServiceProvider.transactions,
  )
  public financialServiceProvider: FinancialServiceProviderEntity;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.transactions,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Index()
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @OneToOne(
    () => LatestTransactionEntity,
    (latestTransaction) => latestTransaction.transaction,
  )
  public latestTransaction: LatestTransactionEntity;
}

import { Column, Entity, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../../registration/registration.entity';

@Entity('transaction')
export class TransactionEntity extends Base121Entity {
  @Column()
  public amount: number;

  @Column()
  public status: string;

  @Column({ nullable: true })
  public errorMessage: string;

  @ManyToOne(
    _type => ProgramEntity,
    program => program.transactions,
  )
  public program: ProgramEntity;

  @Column({ default: 1 })
  public payment: number;

  @Column('json', {
    default: {},
  })
  public customData: JSON;

  @Column({ default: 1 })
  public transactionStep: number;

  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    financialServiceProvider => financialServiceProvider.transactions,
  )
  public financialServiceProvider: FinancialServiceProviderEntity;

  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.transactions,
  )
  public registration: RegistrationEntity;
}

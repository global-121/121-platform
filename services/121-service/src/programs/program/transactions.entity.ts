import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ConnectionEntity } from '../../connection/connection.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public amount: number;

  @Column()
  public created: Date;

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
  public installment: number;

  @Column('json', {
    default: {},
  })
  public customData: JSON;

  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    financialServiceProvider => financialServiceProvider.transactions,
  )
  public financialServiceProvider: FinancialServiceProviderEntity;

  @ManyToOne(
    _type => ConnectionEntity,
    connection => connection.transactions,
  )
  public connection: ConnectionEntity;
}

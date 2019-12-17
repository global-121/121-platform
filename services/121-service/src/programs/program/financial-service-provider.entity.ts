import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ProgramEntity } from './program.entity';
import { TransactionEntity } from './transactions.entity';

@Entity('fsp')
export class FinancialServiceProviderEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public fsp: string;

  @ManyToMany(_type => ProgramEntity, program => program.financialServiceProviders)
  public program: ProgramEntity[];

  @OneToMany(type => TransactionEntity, transactions => transactions.financialServiceProvider)
  public transactions: TransactionEntity[];
}

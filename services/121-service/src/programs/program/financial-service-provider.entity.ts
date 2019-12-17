import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ProgramEntity } from './program.entity';

import { TransactionEntity } from './transactions.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';


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

  @OneToMany(_type => ConnectionEntity, connection => connection.fsp)
  public connection: ConnectionEntity[];

}

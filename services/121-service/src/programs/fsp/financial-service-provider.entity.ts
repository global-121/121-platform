import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ProgramEntity } from '../program/program.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { FspCallLogEntity } from './fsp-call-log.entity';

@Entity('fsp')
export class FinancialServiceProviderEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public fsp: string;

  @Column('json', { nullable: true })
  public fspDisplayName: JSON;

  @OneToMany(
    _type => FspAttributeEntity,
    attributes => attributes.fsp,
  )
  public attributes: FspAttributeEntity[];

  @OneToMany(
    _type => FspCallLogEntity,
    logs => logs.fsp,
  )
  public logs: FspCallLogEntity[];

  @ManyToMany(
    _type => ProgramEntity,
    program => program.financialServiceProviders,
  )
  public program: ProgramEntity[];

  @OneToMany(
    type => TransactionEntity,
    transactions => transactions.financialServiceProvider,
  )
  public transactions: TransactionEntity[];

  @OneToMany(
    _type => ConnectionEntity,
    connection => connection.fsp,
  )
  public connection: ConnectionEntity[];
}

export enum fspName {
  intersolve = 'Intersolve-whatsapp',
  intersolveNoWhatsapp = 'Intersolve-no-whatsapp',
  africasTalking = 'Africas-talking',
}

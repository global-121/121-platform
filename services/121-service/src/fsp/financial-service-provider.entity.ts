import { CascadeDeleteEntity } from '../base.entity';
import { Entity, Column, ManyToMany, OneToMany } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { TransactionEntity } from '../programs/transactions.entity';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { FspCallLogEntity } from './fsp-call-log.entity';

@Entity('fsp')
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
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
    _type => TransactionEntity,
    transactions => transactions.financialServiceProvider,
  )
  public transactions: TransactionEntity[];
}

export enum fspName {
  intersolve = 'Intersolve-whatsapp',
  intersolveNoWhatsapp = 'Intersolve-no-whatsapp',
  africasTalking = 'Africas-talking',
}

import { CascadeDeleteEntity } from '../base.entity';
import { Entity, Column, ManyToMany, OneToMany } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { FspIntegrationType } from './enum/fsp-integration-type.enum';

@Entity('fsp')
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
  @Column()
  public fsp: string;

  @Column('json', { nullable: true })
  public fspDisplayName: JSON;

  @Column({ default: FspIntegrationType.api })
  public integrationType: FspIntegrationType;

  @OneToMany(
    _type => FspAttributeEntity,
    attributes => attributes.fsp,
  )
  public attributes: FspAttributeEntity[];

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

export enum FspName {
  intersolve = 'Intersolve-whatsapp',
  intersolveNoWhatsapp = 'Intersolve-no-whatsapp',
  africasTalking = 'Africas-talking',
  belcash = 'BelCash',
  bobFinance = 'BoB-finance',
}

import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { CascadeDeleteEntity } from '../base.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramEntity } from '../programs/program.entity';
import { Attribute } from './../registration/enum/custom-data-attributes';
import { FspIntegrationType } from './enum/fsp-integration-type.enum';
import { FspQuestionEntity } from './fsp-question.entity';

@Entity('fsp')
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
  @Column({ unique: true })
  public fsp: string;

  @Column('json', { nullable: true })
  public fspDisplayNamePaApp: JSON;

  @Column({ nullable: true })
  public fspDisplayNamePortal: string;

  @Column({ default: FspIntegrationType.api })
  public integrationType: FspIntegrationType;

  @Column({ default: false })
  public notifyOnTransaction: boolean;

  @OneToMany((_type) => FspQuestionEntity, (questions) => questions.fsp)
  public questions: FspQuestionEntity[];

  @ManyToMany(
    (_type) => ProgramEntity,
    (program) => program.financialServiceProviders,
  )
  public program: ProgramEntity[];

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.financialServiceProvider,
  )
  public transactions: TransactionEntity[];

  public editableAttributes?: Attribute[];
}

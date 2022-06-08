import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeUpdate,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { ActionEntity } from '../actions/action.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramAidworkerAssignmentEntity } from './program-aidworker.entity';
import { CascadeDeleteEntity } from '../base.entity';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';

@Entity('program')
export class ProgramEntity extends CascadeDeleteEntity {
  @Column({ default: ProgramPhase.design })
  public phase: ProgramPhase;

  @Column({ nullable: true })
  public location: string;

  @Column('json', { nullable: true })
  public titlePortal: JSON;

  @Column('json', { nullable: true })
  public titlePaApp: JSON;

  @Column({ nullable: true })
  public ngo: string;

  @Column({ nullable: true })
  public startDate: Date;

  @Column({ nullable: true })
  public endDate: Date;

  @Column({ nullable: true })
  public currency: string;

  @Column({ nullable: true })
  public distributionFrequency: string;

  @Column({ nullable: true })
  public distributionDuration: number;

  @Column({ nullable: true })
  public fixedTransferValue: number;

  @Column({ nullable: true })
  public paymentAmountMultiplierFormula: string;

  @ManyToMany(
    () => FinancialServiceProviderEntity,
    financialServiceProviders => financialServiceProviders.program,
  )
  @JoinTable()
  public financialServiceProviders: FinancialServiceProviderEntity[];

  @Column({ nullable: true })
  public inclusionCalculationType: string;

  @Column({ nullable: true })
  public minimumScore: number;

  @Column({ nullable: true })
  public highestScoresX: number;

  @Column('json', { nullable: true })
  public meetingDocuments: JSON;

  @Column('json', { nullable: true })
  public notifications: JSON;

  @Column({ nullable: true })
  public phoneNumberPlaceholder: string;

  @Column('json', { nullable: true })
  public description: JSON;

  @Column('json', { nullable: true })
  public descCashType: JSON;

  @Column({ default: false })
  public published: boolean;

  @Column({ default: true })
  public validation: boolean;

  @Column({ default: false })
  public validationByQr: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @OneToMany(
    () => ProgramAidworkerAssignmentEntity,
    assignment => assignment.program,
  )
  public aidworkerAssignments: ProgramAidworkerAssignmentEntity[];

  @OneToMany(
    () => ActionEntity,
    action => action.program,
  )
  public actions: ActionEntity[];

  @OneToMany(
    () => ProgramQuestionEntity,
    programQuestions => programQuestions.program,
  )
  public programQuestions: ProgramQuestionEntity[];

  @OneToMany(
    () => ProgramCustomAttributeEntity,
    programCustomAttributes => programCustomAttributes.program,
  )
  public programCustomAttributes: ProgramCustomAttributeEntity[];

  @OneToMany(
    () => TransactionEntity,
    transactions => transactions.program,
  )
  public transactions: TransactionEntity[];

  @OneToMany(
    () => RegistrationEntity,
    registrations => registrations.program,
  )
  public registrations: RegistrationEntity[];

  // Can be used to add deprecated custom attributes to an export if
  @Column('json', {
    default: [],
  })
  public deprecatedCustomDataKeys: JSON;

  @Column({ default: false })
  public tryWhatsAppFirst: boolean;
}

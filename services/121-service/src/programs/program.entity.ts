import { ValidationInfo } from './dto/validation-info.dto';
import {
  AnswerTypes,
  CustomAttributeType,
} from './../registration/enum/custom-data-attributes';
import {
  Entity,
  Column,
  OneToMany,
  BeforeUpdate,
  ManyToMany,
  JoinTable,
  getConnection,
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
import { Attribute } from '../registration/enum/custom-data-attributes';
import { InstanceEntity } from '../instance/instance.entity';
import { Attributes } from '../registration/dto/update-attribute.dto';

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @Column('json', { nullable: true, default: null })
  public aboutProgram: JSON;

  public editableAttributes?: Attribute[];

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

  // This is an array of ProgramQuestionEntity names that build up the full name of a PA.
  @Column('json', { nullable: true })
  public fullnameNamingConvention: JSON;

  public async getValidationInfoForQuestionName(
    name: string,
  ): Promise<ValidationInfo> {
    if (name === Attributes.paymentAmountMultiplier) {
      return { type: AnswerTypes.numeric };
    } else if (name === Attributes.phoneNumber) {
      return { type: AnswerTypes.tel };
    }

    const repo = getConnection().getRepository(ProgramEntity);
    const resultProgramQuestion = await repo
      .createQueryBuilder('program')
      .leftJoin('program.programQuestions', 'programQuestion')
      .where('program.id = :programId', { programId: this.id })
      .andWhere('programQuestion.name = :name', { name: name })
      .select('"programQuestion"."answerType"', 'type')
      .addSelect('"programQuestion"."options"', 'options')
      .getRawOne();

    const resultFspQuestion = await repo
      .createQueryBuilder('program')
      .leftJoin('program.financialServiceProviders', 'fsp')
      .leftJoin('fsp.questions', 'question')
      .where('program.id = :programId', { programId: this.id })
      .andWhere('question.name = :name', { name: name })
      .select('"question"."answerType"', 'type')
      .addSelect('"question"."options"', 'options')
      .getRawOne();

    const resultProgramCustomAttribute = await repo
      .createQueryBuilder('program')
      .leftJoin('program.programCustomAttributes', 'programCustomAttribute')
      .where('program.id = :programId', { programId: this.id })
      .andWhere('programCustomAttribute.name = :name', { name: name })
      .select('"programCustomAttribute".type', 'type')
      .getRawOne();

    const repoInstance = getConnection().getRepository(InstanceEntity);
    const resultMonitoringQuestion = await repoInstance
      .createQueryBuilder('instance')
      .leftJoin('instance.monitoringQuestion', 'question')
      .andWhere('question.name = :name', { name: name })
      .select('"question".options', 'options')
      .getRawOne();

    if (resultMonitoringQuestion) {
      resultMonitoringQuestion.type = resultMonitoringQuestion.options
        ? AnswerTypes.dropdown
        : undefined;
    }

    if (
      Number(!!resultProgramQuestion) +
        Number(!!resultFspQuestion) +
        Number(!!resultProgramCustomAttribute) +
        Number(!!resultMonitoringQuestion) >
      1
    ) {
      throw new Error(
        'Found more than one fsp question, program question or  with the same name for program',
      );
    } else if (resultProgramQuestion && resultProgramQuestion.type) {
      return {
        type: resultProgramQuestion.type as AnswerTypes,
        options: resultProgramQuestion.options,
      };
    } else if (resultFspQuestion && resultFspQuestion.type) {
      return {
        type: resultFspQuestion.type as AnswerTypes,
        options: resultFspQuestion.options,
      };
    } else if (
      resultProgramCustomAttribute &&
      resultProgramCustomAttribute.type
    ) {
      return {
        type: resultProgramCustomAttribute.type as CustomAttributeType,
      };
    } else if (resultMonitoringQuestion && resultMonitoringQuestion.type) {
      return {
        type: resultMonitoringQuestion.type,
        options: resultMonitoringQuestion.options,
      };
    } else {
      return new ValidationInfo();
    }
  }
}

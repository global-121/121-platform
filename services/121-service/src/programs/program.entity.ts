import {
  BeforeRemove,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { AppDataSource } from '../../appdatasource';
import { ActionEntity } from '../actions/action.entity';
import { CascadeDeleteEntity } from '../base.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { InstanceEntity } from '../instance/instance.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { Attributes } from '../registration/dto/update-attribute.dto';
import { Attribute } from '../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../registration/registration.entity';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import {
  AnswerTypes,
  CustomAttributeType,
} from './../registration/enum/custom-data-attributes';
import { ValidationInfo } from './dto/validation-info.dto';
import { ProgramFspConfigurationEntity } from './fsp-configuration/program-fsp-configuration.entity';
import { ProgramAidworkerAssignmentEntity } from './program-aidworker.entity';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';

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

  @Column({ nullable: true, type: 'real' })
  public fixedTransferValue: number;

  @Column({ nullable: true })
  public paymentAmountMultiplierFormula: string;

  @ManyToMany(
    () => FinancialServiceProviderEntity,
    (financialServiceProviders) => financialServiceProviders.program,
  )
  @JoinTable()
  public financialServiceProviders: FinancialServiceProviderEntity[];

  @Column({ nullable: true })
  public targetNrRegistrations: number;

  @Column('json', { nullable: true })
  public meetingDocuments: JSON;

  @Column('json', { nullable: true })
  public notifications: JSON;

  @Column({ nullable: true })
  public phoneNumberPlaceholder: string;

  @Column('json', { nullable: true })
  public description: JSON;

  @Column({ default: false })
  public published: boolean;

  @Column({ default: true })
  public validation: boolean;

  @Column('json', { nullable: true, default: null })
  public aboutProgram: JSON;

  public editableAttributes?: Attribute[];

  @OneToMany(
    () => ProgramAidworkerAssignmentEntity,
    (assignment) => assignment.program,
  )
  public aidworkerAssignments: ProgramAidworkerAssignmentEntity[];

  @OneToMany(() => ActionEntity, (action) => action.program)
  public actions: ActionEntity[];

  @OneToMany(
    () => ProgramQuestionEntity,
    (programQuestions) => programQuestions.program,
  )
  public programQuestions: ProgramQuestionEntity[];

  @OneToMany(
    () => ProgramCustomAttributeEntity,
    (programCustomAttributes) => programCustomAttributes.program,
  )
  public programCustomAttributes: ProgramCustomAttributeEntity[];

  @OneToMany(() => TransactionEntity, (transactions) => transactions.program)
  public transactions: TransactionEntity[];

  @OneToMany(() => RegistrationEntity, (registrations) => registrations.program)
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

  @Column('json', { default: [] })
  public languages: JSON;

  @Column({ default: false })
  public enableMaxPayments: boolean;

  @OneToMany(
    () => ProgramFspConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.programId,
  )
  public programFspConfiguration: ProgramFspConfigurationEntity[];

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: ProgramAidworkerAssignmentEntity,
        columnName: 'program',
      },
      {
        entityClass: ActionEntity,
        columnName: 'program',
      },
      {
        entityClass: ProgramQuestionEntity,
        columnName: 'program',
      },
      {
        entityClass: ProgramCustomAttributeEntity,
        columnName: 'program',
      },
      {
        entityClass: TransactionEntity,
        columnName: 'program',
      },
      {
        entityClass: RegistrationEntity,
        columnName: 'program',
      },
    ]);
  }

  public async getValidationInfoForQuestionName(
    name: string,
  ): Promise<ValidationInfo> {
    if (name === Attributes.paymentAmountMultiplier) {
      return { type: AnswerTypes.numeric };
    } else if (name === Attributes.maxPayments) {
      return { type: AnswerTypes.numericNullable };
    } else if (name === Attributes.phoneNumber) {
      return { type: AnswerTypes.tel };
    } else if (name === Attributes.preferredLanguage) {
      return {
        type: AnswerTypes.dropdown,
        options: await this.getPreferredLanguageOptions(),
      };
    }

    const repo = AppDataSource.getRepository(ProgramEntity);
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

    const repoInstance = AppDataSource.getRepository(InstanceEntity);
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

  private async getPreferredLanguageOptions(): Promise<object[]> {
    const repo = AppDataSource.getRepository(ProgramEntity);
    const program = await repo.findOneBy({ id: this.id });

    return JSON.parse(JSON.stringify(program.languages)).map((key: string) => {
      return {
        option: key,
      };
    });
  }
}

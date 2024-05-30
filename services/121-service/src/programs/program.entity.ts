import { ActionEntity } from '@121-service/src/actions/action.entity';
import { AppDataSource } from '@121-service/src/appdatasource';
import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ValidationInfo } from '@121-service/src/programs/dto/validation-info.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { Attributes } from '@121-service/src/registration/dto/update-registration.dto';
import {
  AnswerTypes,
  Attribute,
  CustomAttributeType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import {
  BeforeRemove,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm';

@Entity('program')
export class ProgramEntity extends CascadeDeleteEntity {
  @Column({ type: 'character varying', nullable: true })
  public location: string | null;

  @Column('json', { nullable: true })
  public titlePortal: LocalizedString | null;

  @Column({ type: 'character varying', nullable: true })
  public ngo: string | null;

  @Column({ type: 'timestamp', nullable: true })
  public startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  public endDate: Date | null;

  @Column({ type: 'character varying', nullable: true })
  public currency: string | null;

  @Column({ type: 'character varying', nullable: true })
  public distributionFrequency: string | null;

  @Column({ type: 'integer', nullable: true })
  public distributionDuration: number | null;

  @Column({ nullable: true, type: 'real' })
  public fixedTransferValue: number | null;

  @Column({ type: 'character varying', nullable: true })
  public paymentAmountMultiplierFormula: string | null;

  @Column({ type: 'character varying', nullable: true, default: 'blabla' })
  public stocazzo: string | null;

  @ManyToMany(
    () => FinancialServiceProviderEntity,
    (financialServiceProviders) => financialServiceProviders.program,
  )
  @JoinTable()
  public financialServiceProviders: Relation<FinancialServiceProviderEntity[]>;

  @Column({ type: 'integer', nullable: true })
  public targetNrRegistrations: number | null;

  @Column('json', { nullable: true })
  public description: LocalizedString | null;

  @Column({ default: false })
  public published: boolean;

  @Column({ default: true })
  public validation: boolean;

  @Column('json', { nullable: true, default: null })
  public aboutProgram: LocalizedString | null;

  public editableAttributes?: Attribute[];

  @OneToMany(
    () => ProgramAidworkerAssignmentEntity,
    (assignment) => assignment.program,
  )
  public aidworkerAssignments: Relation<ProgramAidworkerAssignmentEntity[]>;

  @OneToMany(() => ActionEntity, (action) => action.program)
  public actions: ActionEntity[];

  @OneToMany(
    () => ProgramQuestionEntity,
    (programQuestions) => programQuestions.program,
  )
  public programQuestions: Relation<ProgramQuestionEntity[]>;

  @OneToMany(
    () => ProgramCustomAttributeEntity,
    (programCustomAttributes) => programCustomAttributes.program,
  )
  public programCustomAttributes: Relation<ProgramCustomAttributeEntity[]>;

  @OneToMany(() => TransactionEntity, (transactions) => transactions.program)
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(() => RegistrationEntity, (registrations) => registrations.program)
  public registrations: Relation<RegistrationEntity[]>;

  // Can be used to add deprecated custom attributes to an export if
  @Column('json', {
    default: [],
  })
  public deprecatedCustomDataKeys: unknown[];

  @Column({ default: false })
  public tryWhatsAppFirst: boolean;

  // This is an array of ProgramQuestionEntity names that build up the full name of a PA.
  @Column('json', { nullable: true })
  public fullnameNamingConvention: string[] | null;

  @Column('json', { default: [] })
  public languages: LanguageEnum[];

  @Column({ default: false })
  public enableMaxPayments: boolean;

  @Column({ default: false })
  public enableScope: boolean;

  @Column({ nullable: true, default: null, type: 'integer' })
  public budget: number | null;

  @OneToMany(
    () => ProgramFspConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.programId,
  )
  public programFspConfiguration: Relation<ProgramFspConfigurationEntity[]>;

  @Column({ nullable: true, default: null, type: 'character varying' })
  public monitoringDashboardUrl: string | null;

  @Column({ default: false })
  public allowEmptyPhoneNumber: boolean;

  @OneToMany(
    () => MessageTemplateEntity,
    (messageTemplates) => messageTemplates.program,
  )
  public messageTemplates: Relation<MessageTemplateEntity[]>;

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
        entityClass: RegistrationEntity,
        columnName: 'program',
      },
      {
        entityClass: MessageTemplateEntity,
        columnName: 'program',
      },
      {
        entityClass: ProgramFspConfigurationEntity,
        columnName: 'programId',
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
    } else if (name === Attributes.referenceId) {
      return { type: AnswerTypes.text };
    } else if (name === Attributes.phoneNumber) {
      return { type: AnswerTypes.tel };
    } else if (name === Attributes.preferredLanguage) {
      return {
        type: AnswerTypes.dropdown,
        options: await this.getPreferredLanguageOptions(),
      };
    } else if (name === Attributes.scope) {
      return { type: AnswerTypes.text };
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

    if (
      Number(!!resultProgramQuestion) +
        Number(!!resultFspQuestion) +
        Number(!!resultProgramCustomAttribute) >
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

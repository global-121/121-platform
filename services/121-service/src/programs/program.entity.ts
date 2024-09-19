import { BeforeRemove, Column, Entity, OneToMany, Relation } from 'typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { AppDataSource } from '@121-service/src/appdatasource';
import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ValidationInfo } from '@121-service/src/programs/dto/validation-info.dto';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { Attributes } from '@121-service/src/registration/dto/update-registration.dto';
import {
  Attribute,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

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
    () => ProgramRegistrationAttributeEntity,
    (programRegistrationAttributes) => programRegistrationAttributes.program,
  )
  public programRegistrationAttributes: Relation<
    ProgramRegistrationAttributeEntity[]
  >;

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

  // TODO: This can be refactored into 'nameField' so that this can be 1 field name that maps to the 'Name' column in the Portal.
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
    () => ProgramFinancialServiceProviderConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.programId,
  )
  public programFinancialServiceProviderConfigurations: Relation<
    ProgramFinancialServiceProviderConfigurationEntity[]
  >;

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
        entityClass: RegistrationEntity,
        columnName: 'program',
      },
      {
        entityClass: MessageTemplateEntity,
        columnName: 'program',
      },
      {
        entityClass: ProgramFinancialServiceProviderConfigurationEntity,
        columnName: 'programId',
      },
    ]);
  }

  public async getValidationInfoForAttributeName(
    name: string,
  ): Promise<ValidationInfo> {
    if (name === Attributes.paymentAmountMultiplier) {
      return { type: RegistrationAttributeTypes.numeric };
    } else if (name === Attributes.maxPayments) {
      return { type: RegistrationAttributeTypes.numericNullable };
    } else if (name === Attributes.referenceId) {
      return { type: RegistrationAttributeTypes.text };
    } else if (name === Attributes.phoneNumber) {
      return { type: RegistrationAttributeTypes.tel };
    } else if (name === Attributes.preferredLanguage) {
      return {
        type: RegistrationAttributeTypes.dropdown,
        options: await this.getPreferredLanguageOptions(),
      };
    } else if (name === Attributes.scope) {
      return { type: RegistrationAttributeTypes.text };
    }

    const repo = AppDataSource.getRepository(ProgramEntity);
    const resultProgramRegistrationAttribute = await repo
      .createQueryBuilder('program')
      .leftJoin(
        'program.programRegistrationAttributes',
        'programRegistrationAttribute',
      )
      .where('program.id = :programId', { programId: this.id })
      .andWhere('programRegistrationAttribute.name = :name', { name })
      .select('"programRegistrationAttribute"."type"', 'type')
      .addSelect('"programRegistrationAttribute"."options"', 'options')
      .getRawOne();

    if (
      resultProgramRegistrationAttribute &&
      resultProgramRegistrationAttribute.type
    ) {
      return {
        type: resultProgramRegistrationAttribute.type as RegistrationAttributeTypes,
        options: resultProgramRegistrationAttribute.options,
      };
    }
    return new ValidationInfo();
  }

  private async getPreferredLanguageOptions(): Promise<object[]> {
    const repo = AppDataSource.getRepository(ProgramEntity);
    const program = await repo.findOneBy({ id: this.id });

    return JSON.parse(JSON.stringify(program?.languages)).map((key: string) => {
      return {
        option: key,
      };
    });
  }
}

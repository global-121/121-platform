import { BeforeRemove, Column, Entity, OneToMany, Relation } from 'typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { Attribute } from '@121-service/src/registration/enum/registration-attribute.enum';
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

  @Column({ default: false })
  public tryWhatsAppFirst: boolean;

  // TODO: This can be refactored into 'nameField' so that this can be 1 field name that maps to the 'Name' column in the Portal.
  // This is an array of ProgramRegistrationAttributeEntity names that build up the full name of a PA.
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
}

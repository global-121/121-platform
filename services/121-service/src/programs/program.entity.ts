import { Column, Entity, OneToMany, OneToOne, Relation } from 'typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { Base121Entity } from '@121-service/src/base.entity';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { KoboEntity } from '@121-service/src/programs/kobo/enitities/kobo.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { Attribute } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export const DefaultFullNameNamingConvention = ['fullName'];
@Entity('program')
export class ProgramEntity extends Base121Entity {
  @Column({ type: 'character varying', nullable: true, default: null })
  public location: string | null;

  @Column('json', { nullable: true })
  public titlePortal: LocalizedString | null;

  @Column({ type: 'character varying', nullable: true })
  public ngo: string | null;

  @Column({ type: 'date', nullable: true, default: null })
  public startDate: Date | null;

  @Column({ type: 'date', nullable: true, default: null })
  public endDate: Date | null;

  @Column({ type: 'character varying' })
  public currency: string | null;

  @Column({ type: 'character varying', nullable: true })
  public distributionFrequency: string | null;

  @Column({ nullable: true, type: 'real' })
  public fixedTransferValue: number | null;

  @Column({ type: 'character varying', nullable: true })
  public paymentAmountMultiplierFormula: string | null;

  @Column({ type: 'integer', nullable: true })
  public targetNrRegistrations: number | null;

  @Column('json', { nullable: true })
  public description: LocalizedString | null;

  @Column({ default: true })
  public published: boolean;

  @Column({ default: true })
  public validation: boolean;

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
  @Column('json', { default: DefaultFullNameNamingConvention })
  public fullnameNamingConvention: string[];

  @Column('json', { default: [] })
  public languages: LanguageEnum[];

  @Column({ default: false })
  public enableMaxPayments: boolean;

  @Column({ nullable: true, type: 'integer' })
  public defaultMaxPayments: number | null;

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

  @OneToOne(() => KoboEntity, (kobo) => kobo.program, { onDelete: 'SET NULL' })
  public kobo: Relation<KoboEntity>;
}

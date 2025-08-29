import { Column, Entity, OneToMany, Relation } from 'typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { Base121Entity } from '@121-service/src/base.entity';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectAidworkerAssignmentEntity } from '@121-service/src/projects/project-aidworker.entity';
import { ProjectAttachmentEntity } from '@121-service/src/projects/project-attachments/project-attachment.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { Attribute } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Entity('project')
export class ProjectEntity extends Base121Entity {
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
  public aboutProject: LocalizedString | null;

  public editableAttributes?: Attribute[];

  @OneToMany(
    () => ProjectAidworkerAssignmentEntity,
    (assignment) => assignment.project,
  )
  public aidworkerAssignments: Relation<ProjectAidworkerAssignmentEntity[]>;

  @OneToMany(() => ActionEntity, (action) => action.project)
  public actions: ActionEntity[];

  @OneToMany(
    () => ProjectRegistrationAttributeEntity,
    (projectRegistrationAttributes) => projectRegistrationAttributes.project,
  )
  public projectRegistrationAttributes: Relation<
    ProjectRegistrationAttributeEntity[]
  >;

  @OneToMany(() => RegistrationEntity, (registrations) => registrations.project)
  public registrations: Relation<RegistrationEntity[]>;

  @Column({ default: false })
  public tryWhatsAppFirst: boolean;

  // TODO: This can be refactored into 'nameField' so that this can be 1 field name that maps to the 'Name' column in the Portal.
  // This is an array of ProjectRegistrationAttributeEntity names that build up the full name of a PA.
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

  @OneToMany(() => PaymentEntity, (payment) => payment.project)
  public payments: Relation<PaymentEntity[]>;

  @OneToMany(
    () => ProjectFspConfigurationEntity,
    (projectFspConfiguration) => projectFspConfiguration.projectId,
  )
  public projectFspConfigurations: Relation<ProjectFspConfigurationEntity[]>;

  @Column({ nullable: true, default: null, type: 'character varying' })
  public monitoringDashboardUrl: string | null;

  @Column({ default: false })
  public allowEmptyPhoneNumber: boolean;

  @OneToMany(
    () => MessageTemplateEntity,
    (messageTemplates) => messageTemplates.project,
  )
  public messageTemplates: Relation<MessageTemplateEntity[]>;

  @OneToMany(
    () => ProjectAttachmentEntity,
    (attachments) => attachments.project,
  )
  public attachments: Relation<ProjectAttachmentEntity[]>;
}

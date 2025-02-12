/* eslint-disable custom-rules/typeorm-cascade-ondelete*/ // as cascade delete is not applicable for views
import {
  Column,
  DataSource,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { ProjectEntity } from '@121-service/src/programs/program.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@ViewEntity({
  name: 'registration_view',
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('registration.id', 'id')
      .from(RegistrationEntity, 'registration')
      .addSelect(
        `CAST(CONCAT('PA #',registration."registrationProjectId") as VARCHAR)`,
        'personAffectedSequence',
      )
      .addSelect(
        `registration."registrationProjectId"`,
        'registrationProjectId',
      )
      .orderBy(`registration.registrationProjectId`, 'ASC')
      .addSelect('registration.created', 'registrationCreated')
      .addSelect(
        `TO_CHAR(registration.created,'yyyy-mm-dd')`,
        'registrationCreatedDate',
      )
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.projectId', 'projectId')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect(
        'fspconfig."name"',
        'projectFinancialServiceProviderConfigurationName',
      )
      .addSelect(
        'fspconfig."id"',
        'projectFinancialServiceProviderConfigurationId',
      )
      .addSelect(
        'fspconfig."financialServiceProviderName"',
        'financialServiceProviderName',
      )
      .addSelect(
        'fspconfig.label',
        'projectFinancialServiceProviderConfigurationLabel',
      )
      .addSelect('registration.paymentCount', 'paymentCount')
      .addSelect(
        'registration.maxPayments - registration.paymentCount',
        'paymentCountRemaining',
      )
      .addSelect(
        'registration.paymentAmountMultiplier',
        'paymentAmountMultiplier',
      )
      .addSelect('registration.maxPayments', 'maxPayments')
      .addSelect('registration.phoneNumber', 'phoneNumber')
      .addSelect('registration.scope', 'scope')
      .leftJoin(
        'registration.projectFinancialServiceProviderConfiguration',
        'fspconfig',
      )
      .leftJoin('registration.latestMessage', 'latestMessage')
      .leftJoin('latestMessage.message', 'message')
      .addSelect(
        `COALESCE(message.type || ': ' || message.status,'no messages yet')`,
        'lastMessageStatus',
      ),
})
export class RegistrationViewEntity {
  @ViewColumn()
  @PrimaryColumn()
  public id: number;

  @ViewColumn()
  public status: RegistrationStatusEnum;

  @ManyToOne((_type) => ProjectEntity, (project) => project.registrations)
  @JoinColumn({ name: 'projectId' })
  public project: ProjectEntity;
  @Column()
  public projectId: number;

  @ViewColumn()
  public registrationCreated: string;

  @ViewColumn()
  public registrationCreatedDate: string;

  @ViewColumn()
  public referenceId: string;

  @ViewColumn()
  public phoneNumber?: string;

  @ViewColumn()
  public preferredLanguage: LanguageEnum;

  @ViewColumn()
  public inclusionScore: number;

  @ViewColumn()
  public paymentAmountMultiplier: number;

  @ViewColumn()
  public financialServiceProviderName?: FinancialServiceProviders;

  @ViewColumn()
  public projectFinancialServiceProviderConfigurationId: number;

  @ViewColumn()
  public projectFinancialServiceProviderConfigurationName: string;

  @ViewColumn()
  public projectFinancialServiceProviderConfigurationLabel: LocalizedString;

  /** This is an "auto" incrementing field with a registration ID per project. */
  @ViewColumn()
  public registrationProjectId: number;

  @ViewColumn()
  public personAffectedSequence: string;

  @ViewColumn()
  public maxPayments: number;

  @ViewColumn()
  public lastMessageStatus: string;

  @ViewColumn()
  public paymentCount: number;

  @ViewColumn()
  public paymentCountRemaining: number;

  @ViewColumn()
  public scope: string;

  @OneToMany(
    () => RegistrationAttributeDataEntity,
    (registrationData) => registrationData.registration,
  )
  public data: RegistrationAttributeDataEntity[];

  @OneToMany(
    () => RegistrationAttributeDataEntity,
    (registrationData) => registrationData.registration,
  )
  public dataSearchBy: RegistrationAttributeDataEntity[];

  @OneToMany(
    () => LatestTransactionEntity,
    (latestTransactions) => latestTransactions.registration,
    {
      eager: true,
    },
  )
  public latestTransactions: LatestTransactionEntity[];
}

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
import { ProgramEntity } from '@121-service/src/programs/program.entity';
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
        `CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR)`,
        'personAffectedSequence',
      )
      .addSelect(
        `registration."registrationProgramId"`,
        'registrationProgramId',
      )
      .orderBy(`registration.registrationProgramId`, 'ASC')
      .addSelect('registration.created', 'registrationCreated')
      .addSelect(
        `TO_CHAR(registration.created,'yyyy-mm-dd')`,
        'registrationCreatedDate',
      )
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.programId', 'programId')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect(
        'fspconfig."name"',
        'programFinancialServiceProviderConfigurationName',
      )
      .addSelect(
        'fspconfig."id"',
        'programFinancialServiceProviderConfigurationId',
      )
      .addSelect(
        'fspconfig."financialServiceProviderName"',
        'financialServiceProviderName',
      )
      .addSelect(
        'fspconfig.label',
        'programFinancialServiceProviderConfigurationLabel',
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
        'registration.programFinancialServiceProviderConfiguration',
        'fspconfig',
      )
      .leftJoin('registration.latestMessage', 'latestMessage')
      .leftJoin('latestMessage.message', 'message')
      .addSelect(
        `COALESCE(message.type || ': ' || message.status,'no messages yet')`,
        'lastMessageStatus',
      )

      .addSelect(
        `
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN TRUE
        ELSE FALSE
        END)
        `,
        'isDuplicate',
      )
      .leftJoin(
        (qb) =>
          qb
            .select('distinct d1."registrationId"')
            .from('registration_attribute_data', 'd1')
            .innerJoin(
              'registration_attribute_data',
              'd2',
              'd1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND d1.value = d2.value AND d1."registrationId" != d2."registrationId"',
            )
            .innerJoin(
              'program_registration_attribute',
              'pra',
              'd1."programRegistrationAttributeId" = pra.id',
            )
            .where("d1.value != ''")
            .andWhere('pra."duplicateCheck" = true')
            .andWhere(
              'NOT EXISTS (' +
                'SELECT 1 ' +
                'FROM "121-service".registration_unique_pairs rup ' +
                'WHERE (rup."registrationSmallerId" = LEAST(d1."registrationId", d2."registrationId") ' +
                'AND rup."registrationLargerId" = GREATEST(d1."registrationId", d2."registrationId"))' +
                ')',
            ),
        'dup',
        'registration.id = dup."registrationId"',
      ),
})
export class RegistrationViewEntity {
  @ViewColumn()
  @PrimaryColumn()
  public id: number;

  @ViewColumn()
  public status: RegistrationStatusEnum;

  @ManyToOne((_type) => ProgramEntity, (program) => program.registrations)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

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
  public programFinancialServiceProviderConfigurationId: number;

  @ViewColumn()
  public programFinancialServiceProviderConfigurationName: string;

  @ViewColumn()
  public programFinancialServiceProviderConfigurationLabel: LocalizedString;

  /** This is an "auto" incrementing field with a registration ID per program. */
  @ViewColumn()
  public registrationProgramId: number;

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

  @ViewColumn()
  public isDuplicate: boolean;

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

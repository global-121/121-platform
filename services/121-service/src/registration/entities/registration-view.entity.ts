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

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
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
      .addSelect('registration.created', 'created')
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.programId', 'programId')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect('fspconfig."name"', 'programFspConfigurationName')
      .addSelect('fspconfig."id"', 'programFspConfigurationId')
      .addSelect('fspconfig."fspName"', 'fspName')
      .addSelect('fspconfig.label', 'programFspConfigurationLabel')
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
      .leftJoin('registration.programFspConfiguration', 'fspconfig')
      .leftJoin('registration.latestMessage', 'latestMessage')
      .leftJoin('latestMessage.message', 'message')
      .addSelect(
        `COALESCE(message.type || ': ' || message.status,'no messages yet')`,
        'lastMessageStatus',
      )

      .addSelect(
        `
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
        `,
        'duplicateStatus',
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
              'registration',
              'registration1',
              `d1."registrationId" = registration1.id AND registration1."registrationStatus" != '${RegistrationStatusEnum.declined}'`,
            )
            .innerJoin(
              'registration',
              'registration2',
              `d2."registrationId" = registration2.id AND registration2."registrationStatus" != '${RegistrationStatusEnum.declined}'`,
            )
            .innerJoin(
              'program_registration_attribute',
              'pra',
              'd1."programRegistrationAttributeId" = pra.id',
            )
            .andWhere("d1.value != ''")
            .andWhere('pra."duplicateCheck" = true').andWhere(`
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )
            `),
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
  public created: Date;

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
  public fspName: Fsps;

  @ViewColumn()
  public programFspConfigurationId: number;

  @ViewColumn()
  public programFspConfigurationName: string;

  @ViewColumn()
  public programFspConfigurationLabel: LocalizedString;

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
  public duplicateStatus: DuplicateStatus;

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

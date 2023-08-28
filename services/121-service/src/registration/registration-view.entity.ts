import {
  Column,
  DataSource,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  ViewColumn,
  ViewEntity,
} from 'typeorm';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../programs/program.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationMaterializedViewEntity } from './registration-materialized-view.entity';
import { RegistrationEntity } from './registration.entity';

@ViewEntity({
  materialized: false,
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('registration.id', 'id')
      .from(RegistrationMaterializedViewEntity, 'registration_materialized')
      .leftJoin(
        RegistrationEntity,
        'registration',
        'registration.id = registration_materialized.id',
      )
      .addSelect('registration.registrationProgramId', 'registrationProgramId')
      .orderBy(`registration.registrationProgramId`, 'ASC')
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.programId', 'programId')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect('registration.noteUpdated', 'noteUpdated')
      .addSelect(
        'registration_materialized."amountPaymentsReceived"',
        'amountPaymentsReceived',
      )
      .addSelect(
        'registration_materialized."financialServiceProvider"',
        'financialServiceProvider',
      )
      .addSelect(
        'registration_materialized."fspDisplayNamePortal"',
        'fspDisplayNamePortal',
      )
      .addSelect(
        'registration.paymentAmountMultiplier',
        'paymentAmountMultiplier',
      )
      .addSelect('registration.maxPayments', 'maxPayments')
      .addSelect('registration.phoneNumber', 'phoneNumber')
      .addSelect('registration.note', 'note')
      .addSelect(
        'registration_materialized."lastTransactionCreated"',
        'lastTransactionCreated',
      )
      .addSelect(
        'registration_materialized."lastTransactionPaymentNumber"',
        'lastTransactionPaymentNumber',
      )
      .addSelect(
        'registration_materialized."lastTransactionStatus"',
        'lastTransactionStatus',
      )
      .addSelect(
        'registration_materialized."lastTransactionAmount"',
        'lastTransactionAmount',
      )
      .addSelect(
        'registration_materialized."lastTransactionErrorMessage"',
        'lastTransactionErrorMessage',
      )
      .addSelect(
        'registration_materialized."lastTransactionCustomData"',
        'lastTransactionCustomData',
      )
      .addSelect('registration_materialized."importedDate"', 'importedDate')
      .addSelect('registration_materialized."registeredDate"', 'registeredDate')
      .addSelect('registration_materialized."invitedDate"', 'invitedDate')
      .addSelect(
        'registration_materialized."startedRegistrationDate"',
        'startedRegistrationDate',
      )
      .addSelect(
        'registration_materialized."selectedForValidationDate"',
        'selectedForValidationDate',
      )
      .addSelect('registration_materialized."validationDate"', 'validationDate')
      .addSelect('registration_materialized."inclusionDate"', 'inclusionDate')
      .addSelect('registration_materialized."rejectionDate"', 'rejectionDate')
      .addSelect(
        'registration_materialized."noLongerEligibleDate"',
        'noLongerEligibleDate',
      )
      .addSelect(
        'registration_materialized."registeredWhileNoLongerEligibleDate"',
        'registeredWhileNoLongerEligibleDate',
      )
      .addSelect(
        `"registration_materialized"."inclusionEndDate"`,
        'inclusionEndDate',
      )
      .addSelect(`"registration_materialized"."deleteDate"`, 'deleteDate')
      .addSelect(`"registration_materialized"."completedDate"`, 'completedDate')
      .addSelect(
        `"registration_materialized"."lastMessageStatus"`,
        'lastMessageStatus',
      )
      .addSelect(
        `"registration_materialized"."lastMessageType"`,
        'lastMessageType',
      ),
})
export class RegistrationViewEntity {
  @ViewColumn()
  @PrimaryColumn()
  @Index({ unique: true })
  public id: number;

  @ViewColumn()
  public status: RegistrationStatusEnum;

  @ManyToOne((_type) => ProgramEntity, (program) => program.registrations)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @ViewColumn()
  public referenceId: string;

  @ViewColumn()
  public phoneNumber: string;

  @ViewColumn()
  public preferredLanguage: LanguageEnum;

  @ViewColumn()
  public inclusionScore: number;

  @ViewColumn()
  public paymentAmountMultiplier: number;

  @ViewColumn()
  public note: string;

  @ViewColumn()
  public noteUpdated: Date;

  @ViewColumn()
  public financialServiceProvider: FspName;

  @ViewColumn()
  public fspDisplayNamePortal: string;

  /** This is an "auto" incrementing field with a registration ID per program. */
  @ViewColumn()
  public registrationProgramId: number;

  @ViewColumn()
  public maxPayments: number;

  @ViewColumn()
  public lastTransactionCreated: Date;

  @ViewColumn()
  public lastTransactionPaymentNumber: number;

  @ViewColumn()
  public lastTransactionStatus: string;

  @ViewColumn()
  public lastTransactionAmount: number;

  @ViewColumn()
  public lastTransactionErrorMessage: string;

  @ViewColumn()
  public lastTransactionCustomData: string;

  @ViewColumn()
  public amountPaymentsReceived: number;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.registration,
    {
      eager: true,
    },
  )
  public data: RegistrationDataEntity[];

  @ViewColumn()
  public importedDate: Date;

  @ViewColumn()
  public invitedDate: Date;

  @ViewColumn()
  public startedRegistrationDate: Date;

  @ViewColumn()
  public registeredWhileNoLongerEligibleDate: Date;

  @ViewColumn()
  public registeredDate: Date;

  @ViewColumn()
  public rejectionDate: Date;

  @ViewColumn()
  public noLongerEligibleDate: Date;

  @ViewColumn()
  public validationDate: Date;

  @ViewColumn()
  public inclusionDate: Date;

  @ViewColumn()
  public inclusionEndDate: Date;

  @ViewColumn()
  public selectedForValidationDate: Date;

  @ViewColumn()
  public deleteDate: Date;

  @ViewColumn()
  public completedDate: Date;

  @ViewColumn()
  public lastMessageStatus: Date;

  @ViewColumn()
  public lastMessageType: Date;
}

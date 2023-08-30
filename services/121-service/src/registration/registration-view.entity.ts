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
import { FspName } from '../fsp/enum/fsp-name.enum';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramEntity } from '../programs/program.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationEntity } from './registration.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('registration.id', 'id')
      .from(RegistrationEntity, 'registration')
      .addSelect(
        `CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR)`,
        'registrationProgramId',
      )
      .orderBy(`registration.registrationProgramId`, 'ASC')
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.programId', 'programId')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect('registration.noteUpdated', 'noteUpdated')
      .addSelect('fsp.fsp', 'financialServiceProvider')
      .addSelect('fsp.fspDisplayNamePortal', 'fspDisplayNamePortal')
      .addSelect(
        'registration.paymentAmountMultiplier',
        'paymentAmountMultiplier',
      )
      .addSelect('registration.maxPayments', 'maxPayments')
      .addSelect('registration.phoneNumber', 'phoneNumber')
      .addSelect('registration.note', 'note')
      .leftJoin('registration.fsp', 'fsp')
      .leftJoin(
        (qb) =>
          qb
            .from(TransactionEntity, 'transactions')
            .select('MAX("payment")', 'payment')
            .addSelect('COUNT(DISTINCT(payment))', 'amountPaymentsReceived')
            .addSelect('"registrationId"', 'registrationId')
            .groupBy('"registrationId"'),
        'transaction_max_payment',
        'transaction_max_payment."registrationId" = registration.id',
      )
      .addSelect(
        '"amountPaymentsReceived" - "maxPayments"',
        'amountPaymentsRemaining',
      )
      .addSelect(
        'transaction_max_payment."amountPaymentsReceived"',
        'amountPaymentsReceived',
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

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.registration,
    {
      eager: true,
    },
  )
  public data: RegistrationDataEntity[];

  @ViewColumn()
  public amountPaymentsReceived: number;

  @ViewColumn()
  public amountPaymentsRemaining: number;
}

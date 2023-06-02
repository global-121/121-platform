import { DataSource, OneToMany, PrimaryColumn, ViewColumn, ViewEntity } from "typeorm";
import { LanguageEnum } from "./enum/language.enum";
import { RegistrationStatusEnum } from "./enum/registration-status.enum";
import { RegistrationEntity } from "./registration.entity";
import { RegistrationDataEntity } from "./registration-data.entity";
import { FspName } from "../fsp/enum/fsp-name.enum";
import { TransactionEntity } from "../payments/transactions/transaction.entity";

@ViewEntity({
  expression: (dataSource: DataSource) => dataSource.createQueryBuilder()
    .select('registration.id', 'id')
    .where('1 = 1')
    .from(RegistrationEntity, 'registration')
    .addSelect('registration.registrationProgramId', 'registrationProgramId')
    .distinctOn(['registration.registrationProgramId'])
    .orderBy(`registration.registrationProgramId`, 'ASC')
    .addSelect('registration.referenceId', 'referenceId')
    .addSelect('registration.registrationStatus', 'status')
    .addSelect('registration.preferredLanguage', 'preferredLanguage')
    .addSelect('registration.inclusionScore', 'inclusionScore')
    .addSelect('fsp.fsp', 'fsp')
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
          .addSelect('COUNT(DISTINCT(payment))', 'nrPayments')
          .addSelect('"registrationId"', 'registrationId')
          .groupBy('"registrationId"'),
      'transaction_max_payment',
      'transaction_max_payment."registrationId" = registration.id',
    )
    .leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("transactionStep")', 'transactionStep')
          .addSelect('"payment"', 'payment')
          .groupBy('"payment"')
          .addSelect('"registrationId"', 'registrationId')
          .addGroupBy('"registrationId"'),
      'transaction_max_transaction_step',
      `transaction_max_transaction_step."registrationId" = registration.id
      AND transaction_max_transaction_step.payment = transaction_max_payment.payment`,
    )
    .leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("created")', 'created')
          .addSelect('"payment"', 'payment')
          .groupBy('"payment"')
          .addSelect('"transactionStep"', 'transactionStep')
          .addGroupBy('"transactionStep"')
          .addSelect('"registrationId"', 'registrationId')
          .addGroupBy('"registrationId"'),
      'transaction_max_created',
      `transaction_max_created."registrationId" = registration.id
      AND transaction_max_created.payment = transaction_max_payment.payment
      AND transaction_max_created."transactionStep" = transaction_max_transaction_step."transactionStep"`,
    )
    .leftJoin(
      'registration.transactions',
      'transaction',
      `transaction."registrationId" = transaction_max_created."registrationId"
      AND transaction.payment = transaction_max_created.payment
      AND transaction."transactionStep" = transaction_max_created."transactionStep"
      AND transaction."created" = transaction_max_created."created"`,
    )
    .addSelect([
      'transaction.created AS "paymentDate"',
      'transaction.payment AS payment',
      'transaction.status AS "transactionStatus"',
      'transaction.amount AS "transactionAmount"',
      'transaction.errorMessage as "errorMessage"',
      'transaction.customData as "customData"',
      'transaction_max_payment."nrPayments" as "nrPayments"',
    ])

})
export class RegistrationViewEntity  {
  @ViewColumn()
  @PrimaryColumn()
  public id: number;

  @ViewColumn( )
  public status: RegistrationStatusEnum;

  @ViewColumn()
  public referenceId: string;

  @ViewColumn( )
  public phoneNumber: string;

  @ViewColumn( )
  public preferredLanguage: LanguageEnum;

  @ViewColumn( )
  public inclusionScore: number;

  @ViewColumn( )
  public paymentAmountMultiplier: number;

  @ViewColumn( )
  public note: string;

  @ViewColumn()
  public fsp: FspName;

  // @ViewColumn( )
  // public noteUpdated: Date;

  /** This is an "auto" incrementing field with a registration ID per program. */
  @ViewColumn()
  public registrationProgramId: number;

  @ViewColumn()
  public maxPayments: number;

  @ViewColumn()
  public paymentDate: Date;

  @ViewColumn()
  public payment: number;

  @ViewColumn()
  public transactionStatus: string;

  @ViewColumn()
  public transactionAmount: string;

  @ViewColumn()
  public errorMessage: string;

  @ViewColumn()
  public customData: string;

  @ViewColumn()
  public nrPayments: number;

  @OneToMany(() => RegistrationDataEntity, (registrationData) => registrationData.registration, {
    eager: true,
  })
  public data: RegistrationDataEntity[];
}

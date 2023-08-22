import {
  DataSource,
  OneToMany,
  PrimaryColumn,
  ViewColumn,
  ViewEntity,
} from 'typeorm';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationEntity } from './registration.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
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
        'transaction.created AS "lastTransactionCreated"',
        'transaction.payment AS "lastTransactionPaymentNumber"',
        'transaction.status AS "lastTransactionStatus"',
        'transaction.amount AS "lastTransactionAmount"',
        'transaction.errorMessage as "lastTransactionErrorMessage"',
        'transaction.customData as "lastTransactionCustomData"',
        'transaction_max_payment."amountPaymentsReceived" as "amountPaymentsReceived"',
      ])
      .addSelect(`"imported".created`, 'importedDate')
      .addSelect(`"registered".created`, 'registeredDate')
      .addSelect(`"invited".created`, 'invitedDate')
      .addSelect(`"startedRegistration".created`, 'startedRegistrationDate')
      .addSelect(`"selectedForValidation".created`, 'selectedForValidationDate')
      .addSelect(`"validated".created`, 'validationDate')
      .addSelect(`"included".created`, 'inclusionDate')
      .addSelect(`"rejected".created`, 'rejectionDate')
      .addSelect(`"noLongerEligible".created`, 'noLongerEligibleDate')
      .addSelect(
        `"registeredWhileNoLongerEligible".created`,
        'registeredWhileNoLongerEligibleDate',
      )
      .addSelect(`"inclusionEnded".created`, 'inclusionEndDate')
      .addSelect(`"deleted".created`, 'deleteDate')
      .addSelect(`"completed".created`, 'completedDate')
      .leftJoin(
        RegistrationStatusChangeEntity,
        'imported',
        `registration.id = "imported"."registrationId" AND "imported"."registrationStatus" = 'imported'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'registered',
        `registration.id = "registered"."registrationId" AND "registered"."registrationStatus" = 'registered'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'invited',
        `registration.id = "invited"."registrationId" AND "invited"."registrationStatus" = 'invited'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'startedRegistration',
        `registration.id = "startedRegistration"."registrationId" AND "startedRegistration"."registrationStatus" = 'startedRegistration'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'selectedForValidation',
        `registration.id = "selectedForValidation"."registrationId" AND "selectedForValidation"."registrationStatus" = 'selectedForValidation'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'validated',
        `registration.id = "validated"."registrationId" AND "validated"."registrationStatus" = 'validated'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'included',
        `registration.id = "included"."registrationId" AND "included"."registrationStatus" = 'included'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'rejected',
        `registration.id = "rejected"."registrationId" AND "rejected"."registrationStatus" = 'rejected'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'noLongerEligible',
        `registration.id = "noLongerEligible"."registrationId" AND "noLongerEligible"."registrationStatus" = 'noLongerEligible'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'registeredWhileNoLongerEligible',
        `registration.id = "registeredWhileNoLongerEligible"."registrationId" AND "registeredWhileNoLongerEligible"."registrationStatus" = 'registeredWhileNoLongerEligible'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'inclusionEnded',
        `registration.id = "inclusionEnded"."registrationId" AND "inclusionEnded"."registrationStatus" = 'inclusionEnded'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'deleted',
        `registration.id = "deleted"."registrationId" AND "deleted"."registrationStatus" = 'deleted'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        'completed',
        `registration.id = "completed"."registrationId" AND "completed"."registrationStatus" = 'completed'`,
      )
      .leftJoin(
        (qb) =>
          qb
            .from(TwilioMessageEntity, 'messages')
            .select('MAX("created")', 'created')
            .addSelect('"registrationId"', 'registrationId')
            .groupBy('"registrationId"'),
        'messages_max_created',
        'messages_max_created."registrationId" = registration.id',
      )
      .leftJoin(
        'registration.twilioMessages',
        'twilioMessages',
        `twilioMessages.created = messages_max_created.created`,
      )
      .addSelect([
        '"twilioMessages"."status" AS "lastMessageStatus"',
        '"twilioMessages"."type" AS "lastMessageType"',
      ]),
})
export class RegistrationViewEntity {
  @ViewColumn()
  @PrimaryColumn()
  public id: number;

  @ViewColumn()
  public status: RegistrationStatusEnum;

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

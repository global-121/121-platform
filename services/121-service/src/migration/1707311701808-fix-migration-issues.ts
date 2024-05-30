import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMigrationIssues1707311701808 implements MigrationInterface {
  name = 'FixMigrationIssues1707311701808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" DROP CONSTRAINT "FK_718c48c84b802de3cf219e2fc1d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_6634d98139a8fc61021f189dd7"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_09f4da9c51fed8a8db4ea7050b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_413177db362a330842ce655eec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "CHK_9f7cfabf318ce6625bf89723d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_77ed0fd5862f02ff38ffd02c1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" DROP CONSTRAINT "CHK_8d56d7d27b2726d694389cd996"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included"]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included"]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b7066ccd779cbca64bd6f41cbf" ON "121-service"."commercial_bank_ethiopia_account_enquiries" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41e692efd4cd50e16e2bc10a1b" ON "121-service"."exchange_rate" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_195792c9d257056fca35640733" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "CHK_678e69ed7c700f7aaef1e3dbd7" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_d12a7bfebb0c626f637e4bb097" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_1a7ef66c073262ace9968c53c6" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ADD CONSTRAINT "FK_91a620467ab21f97439b6d6b90a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."commercial_bank_ethiopia_account_enquiries_id_seq" OWNED BY "121-service"."commercial_bank_ethiopia_account_enquiries"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."commercial_bank_ethiopia_account_enquiries_id_seq"')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."commercial_bank_ethiopia_account_enquiries_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" DROP CONSTRAINT "FK_91a620467ab21f97439b6d6b90a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" DROP CONSTRAINT "CHK_1a7ef66c073262ace9968c53c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_d12a7bfebb0c626f637e4bb097"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "CHK_678e69ed7c700f7aaef1e3dbd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_195792c9d257056fca35640733"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_41e692efd4cd50e16e2bc10a1b"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b7066ccd779cbca64bd6f41cbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."commercial-bank-ethiopia-account-enquiries_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included","selected-for-validation"]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included","selected-for-validation"]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_8d56d7d27b2726d694389cd996" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_77ed0fd5862f02ff38ffd02c1c" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "CHK_9f7cfabf318ce6625bf89723d1" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_413177db362a330842ce655eec" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09f4da9c51fed8a8db4ea7050b" ON "121-service"."exchange_rate" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6634d98139a8fc61021f189dd7" ON "121-service"."commercial_bank_ethiopia_account_enquiries" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ADD CONSTRAINT "FK_718c48c84b802de3cf219e2fc1d" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

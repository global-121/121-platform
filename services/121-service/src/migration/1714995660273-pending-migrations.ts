import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingMigrations1714995660273 implements MigrationInterface {
  name = 'PendingMigrations1714995660273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_896340143242fdef486ec4d30d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_e5aaeb2fe30d63a7430bcd349d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP CONSTRAINT "CHK_00f87680a13a8334037888a940"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP CONSTRAINT "CHK_86a6324cb4973a8a8a97575204"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_72a02cc41ed3e30ff65e41d436"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_fb533325a9a3f2885c9f97e1b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "fspId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_80c147c52ef5a3b8afecd92646" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "CHK_eded94beb6d402e97ac2afcc22" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_c363973649bdd3a6c472f165de" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_c363973649bdd3a6c472f165de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP CONSTRAINT "CHK_eded94beb6d402e97ac2afcc22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_80c147c52ef5a3b8afecd92646"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "fspId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_fb533325a9a3f2885c9f97e1b6" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'startedRegistrationDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_72a02cc41ed3e30ff65e41d436" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "CHK_86a6324cb4973a8a8a97575204" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'startedRegistrationDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "CHK_00f87680a13a8334037888a940" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_e5aaeb2fe30d63a7430bcd349d" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'startedRegistrationDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_896340143242fdef486ec4d30d" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveInviteFlow1711009396879 implements MigrationInterface {
  name = 'RemoveInviteFlow1711009396879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropConstraint(
      queryRunner,
      '121-service',
      'program_custom_attribute',
      'CHK_fb533325a9a3f2885c9f97e1b6',
    );
    await this.dropConstraint(
      queryRunner,
      '121-service',
      'financial_service_provider_question',
      'CHK_86a6324cb4973a8a8a97575204',
    );
    await this.dropConstraint(
      queryRunner,
      '121-service',
      'program_question',
      'CHK_e5aaeb2fe30d63a7430bcd349d',
    );
    await this.dropConstraint(
      queryRunner,
      '121-service',
      'monitoring_question',
      'CHK_be433d4ba5c0df7af96051dad6',
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_be433d4ba5c0df7af96051dad6" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'startedRegistrationDate', 'registeredDate', 'rejectionDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_e5aaeb2fe30d63a7430bcd349d" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'startedRegistrationDate', 'registeredDate', 'rejectionDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "CHK_86a6324cb4973a8a8a97575204" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'startedRegistrationDate', 'registeredDate', 'rejectionDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_fb533325a9a3f2885c9f97e1b6" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'startedRegistrationDate', 'registeredDate', 'rejectionDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );

    await this.removeRegistrationsWithOldStatus(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_fb533325a9a3f2885c9f97e1b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP CONSTRAINT "CHK_86a6324cb4973a8a8a97575204"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_e5aaeb2fe30d63a7430bcd349d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" DROP CONSTRAINT "CHK_be433d4ba5c0df7af96051dad6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_72a02cc41ed3e30ff65e41d436" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "CHK_00f87680a13a8334037888a940" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_896340143242fdef486ec4d30d" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_edf89077510a37732bbbb1800a" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying, 'declinedDate'::character varying])::text[])))`,
    );
  }

  private async removeRegistrationsWithOldStatus(queryRunner: QueryRunner) {
    const oldStatusses = [
      'invited',
      'imported',
      'registeredWhileNoLongerEligible',
      'noLongerEligible',
    ];
    const idObjects = await queryRunner.query(
      `SELECT id FROM "121-service"."registration" WHERE "registrationStatus" IN ('${oldStatusses.join("','")}')`,
    );
    const ids = idObjects.map((idObject: { id: string }) => idObject.id);
    if (ids.length === 0) {
      return;
    }
    // delete registartion data
    await queryRunner.query(
      `DELETE FROM "121-service"."registration_data" WHERE "registrationId" IN ('${ids.join("','")}')`,
    );

    // delete latest messages
    await queryRunner.query(
      `DELETE FROM "121-service"."latest_message" WHERE "registrationId" IN ('${ids.join("','")}')`,
    );

    // delete messages
    await queryRunner.query(
      `DELETE FROM "121-service"."twilio_message" WHERE "registrationId" IN ('${ids.join("','")}')`,
    );

    // remove phonenumber from registrations
    await queryRunner.query(
      `UPDATE "121-service"."registration" SET "phoneNumber" = NULL WHERE "id" IN ('${ids.join("','")}')`,
    );

    // set registrations to status deleted
    await queryRunner.query(
      `UPDATE "121-service"."registration" SET "registrationStatus" = 'deleted' WHERE "id" IN ('${ids.join("','")}')`,
    );
  }

  private async dropConstraint(
    queryRunner: QueryRunner,
    schema: string,
    table: string,
    constraint: string,
  ) {
    const result = await queryRunner.query(
      `SELECT constraint_name
       FROM information_schema.table_constraints
       WHERE table_schema = $1 AND table_name = $2 AND constraint_name = $3`,
      [schema, table, constraint],
    );

    if (result.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${constraint}"`,
      );
    }
  }
}

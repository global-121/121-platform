import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixIssues1701764895113 implements MigrationInterface {
  name = 'FixIssues1701764895113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_1d426fe37d1207fa9925a3988e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "CHK_f2bd68795725d87991f93c9436"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_38922d6385e644c5bed646bd5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" DROP CONSTRAINT "CHK_e71cce6f501f7222fc90f3efd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_413177db362a330842ce655eec" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "CHK_9f7cfabf318ce6625bf89723d1" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_77ed0fd5862f02ff38ffd02c1c" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_8d56d7d27b2726d694389cd996" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    const result = await queryRunner.query(`
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_cd56d3267e8553557ec97c6741b'
    `);

    // If the constraint does not exist, add it
    if (result.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" DROP CONSTRAINT "CHK_8d56d7d27b2726d694389cd996"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_77ed0fd5862f02ff38ffd02c1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "CHK_9f7cfabf318ce6625bf89723d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_413177db362a330842ce655eec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_e71cce6f501f7222fc90f3efd7" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_38922d6385e644c5bed646bd5c" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "CHK_f2bd68795725d87991f93c9436" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_1d426fe37d1207fa9925a3988e" CHECK (((name)::text <> ALL ((ARRAY['id'::character varying, 'status'::character varying, 'referenceId'::character varying, 'preferredLanguage'::character varying, 'inclusionScore'::character varying, 'paymentAmountMultiplier'::character varying, 'financialServiceProvider'::character varying, 'registrationProgramId'::character varying, 'maxPayments'::character varying, 'lastTransactionCreated'::character varying, 'lastTransactionPaymentNumber'::character varying, 'lastTransactionStatus'::character varying, 'lastTransactionAmount'::character varying, 'lastTransactionErrorMessage'::character varying, 'lastTransactionCustomData'::character varying, 'paymentCount'::character varying, 'paymentCountRemaining'::character varying, 'importedDate'::character varying, 'invitedDate'::character varying, 'startedRegistrationDate'::character varying, 'registeredWhileNoLongerEligibleDate'::character varying, 'registeredDate'::character varying, 'rejectionDate'::character varying, 'noLongerEligibleDate'::character varying, 'validationDate'::character varying, 'inclusionDate'::character varying, 'inclusionEndDate'::character varying, 'selectedForValidationDate'::character varying, 'deleteDate'::character varying, 'completedDate'::character varying, 'lastMessageStatus'::character varying, 'lastMessageType'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE(message.type || ': ' || message.status,'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE(message.type || \': \' || message.status,\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }
}

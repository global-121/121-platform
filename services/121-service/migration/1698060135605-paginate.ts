import { MigrationInterface, QueryRunner } from 'typeorm';

export class Paginate1698060135605 implements MigrationInterface {
  name = 'Paginate1698060135605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ############################################################
    // Migrate name values in the name columns of fsp attributes and program questions
    // ############################################################
    await queryRunner.query(
      `UPDATE "121-service".fsp_attribute SET "name" = 'fullName' WHERE "name" = 'name'`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."program_question" SET "name" = 'fullName' WHERE "name" = 'name'`,
    );

    await queryRunner.query(
      `UPDATE "121-service"."program_question" SET "name" = 'fullName' WHERE "name" = 'name'`,
    );

    await queryRunner.query(`
      UPDATE "121-service"."program"
      SET "fullnameNamingConvention" = '["fullName"]'::jsonb::json
      WHERE   "fullnameNamingConvention"::jsonb = '["name"]'
    `);

    // ############################################################
    // #### Generated migrations ##################################
    // ############################################################

    await queryRunner.query(
      `CREATE TABLE "121-service"."latest_transaction" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "payment" integer NOT NULL DEFAULT '1', "registrationId" integer, "transactionId" integer, CONSTRAINT "registrationPaymentLatestTransactionUnique" UNIQUE ("registrationId", "payment"), CONSTRAINT "REL_10994d027e2fbaf4ff8e8bf5f4" UNIQUE ("transactionId"), CONSTRAINT "PK_dbfdd1bd40e8b22422efaf592ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18f7adecdbe9b35cf252baf8b7" ON "121-service"."latest_transaction" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_439c3da422d6de1916e4e4e815" ON "121-service"."latest_transaction" ("payment") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a218fd8d386666984192f30636" ON "121-service"."latest_transaction" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10994d027e2fbaf4ff8e8bf5f4" ON "121-service"."latest_transaction" ("transactionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "lastMessageStatus" character varying NOT NULL DEFAULT 'no messages yet'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "paymentCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65982d6021412781740a70c895" ON "121-service"."registration_data" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6105f577e2598f69703dc782da" ON "121-service"."registration_data" ("value") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63f749fc7f7178ae1ad85d3b95" ON "121-service"."transaction" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a2576be389f520bece9d7dbb9" ON "121-service"."transaction" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9de58ca3e7c32731a9f6aa3d02" ON "121-service"."twilio_message" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2257d31c7aabd2568ea3093ed" ON "121-service"."registration" ("registrationProgramId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "CHK_1d426fe37d1207fa9925a3988e" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "CHK_f2bd68795725d87991f93c9436" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "CHK_38922d6385e644c5bed646bd5c" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" ADD CONSTRAINT "CHK_e71cce6f501f7222fc90f3efd7" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'selectedForValidationDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "CHK_8a7f003624256c9557f4971425" CHECK ("referenceId" NOT IN ('status'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_a218fd8d386666984192f306367" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );

    // ############################################################
    // Custom written inserts
    // ############################################################
    await queryRunner.query(`
          UPDATE
              "121-service"."registration"
            SET
              "lastMessageStatus" = ("updateData"."lastMessageType" || ': ' || "updateData"."lastMessageStatus")
            FROM
              (
              SELECT
                *
              FROM
                (
                SELECT
                  DISTINCT ON
                  (registration.id) registration.id AS id,
                  twilio_message."status" AS "lastMessageStatus",
                  twilio_message."type" AS "lastMessageType"
                FROM
                "121-service".registration
                LEFT JOIN "121-service".twilio_message
            ON
                  twilio_message."registrationId" = registration.id
                ORDER BY
                  registration.id,
                  twilio_message.created DESC
              ) latestmessage
              WHERE
                latestmessage."lastMessageStatus" IS NOT NULL
            ) "updateData"
            WHERE
              "registration"."id" = "updateData"."id";
            `);

    await queryRunner.query(`UPDATE "121-service".registration oreg
        SET "paymentCount" = (
          SELECT COUNT(DISTINCT payment)
          FROM "121-service".transaction t
          WHERE t."registrationId" = oreg.id
        )
      `);

    await queryRunner.query(`
        INSERT INTO "121-service"."latest_transaction" ("payment", "registrationId", "transactionId")
        SELECT t.payment, t."registrationId", t.id AS transactionId
        FROM (
            SELECT payment, "registrationId", MAX(created) AS max_created
            FROM "121-service"."transaction"
            GROUP BY payment, "registrationId"
        ) AS latest_transactions
        INNER JOIN "121-service"."transaction" AS t
            ON t.payment = latest_transactions.payment
            AND t."registrationId" = latest_transactions."registrationId"
            AND t.created = latest_transactions.max_created;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_a218fd8d386666984192f306367"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "CHK_8a7f003624256c9557f4971425"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."monitoring_question" DROP CONSTRAINT "CHK_e71cce6f501f7222fc90f3efd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "CHK_38922d6385e644c5bed646bd5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "CHK_f2bd68795725d87991f93c9436"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "CHK_1d426fe37d1207fa9925a3988e"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f2257d31c7aabd2568ea3093ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9de58ca3e7c32731a9f6aa3d02"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3a2576be389f520bece9d7dbb9"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_63f749fc7f7178ae1ad85d3b95"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_6105f577e2598f69703dc782da"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_65982d6021412781740a70c895"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "paymentCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "lastMessageStatus"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_10994d027e2fbaf4ff8e8bf5f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a218fd8d386666984192f30636"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_439c3da422d6de1916e4e4e815"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_18f7adecdbe9b35cf252baf8b7"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."latest_transaction"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class LatestMessage1699632564090 implements MigrationInterface {
  name = 'LatestMessage1699632564090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `CREATE TABLE "121-service"."latest_message" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer, "messageId" integer, CONSTRAINT "UQ_b1e5575d941a3f0ce8430c0edfb" UNIQUE ("registrationId"), CONSTRAINT "REL_b1e5575d941a3f0ce8430c0edf" UNIQUE ("registrationId"), CONSTRAINT "REL_2a2f05ef6c49d8b6f86a27e55c" UNIQUE ("messageId"), CONSTRAINT "PK_6061ad154703f7392f8ba07ece3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b8f656ac38b09c68a22854d55" ON "121-service"."latest_message" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1e5575d941a3f0ce8430c0edf" ON "121-service"."latest_message" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a2f05ef6c49d8b6f86a27e55c" ON "121-service"."latest_message" ("messageId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "lastMessageStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ADD CONSTRAINT "FK_b1e5575d941a3f0ce8430c0edfb" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ADD CONSTRAINT "FK_2a2f05ef6c49d8b6f86a27e55c9" FOREIGN KEY ("messageId") REFERENCES "121-service"."twilio_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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

    // ############################################################
    // Custom written inserts
    // ############################################################
    await queryRunner.query(`
    INSERT INTO "121-service".latest_message
        (created, updated, "registrationId", "messageId")
              select
              	created
              	,created
                ,"registrationId" 
                ,"messageId" 
              FROM
                (
                SELECT
                  DISTINCT ON
                  (registration.id) registration.id AS "registrationId",
                  twilio_message."id" AS "messageId",
                  twilio_message.created as created
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
                latestmessage."messageId" IS NOT NULL
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" DROP CONSTRAINT "FK_2a2f05ef6c49d8b6f86a27e55c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" DROP CONSTRAINT "FK_b1e5575d941a3f0ce8430c0edfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "lastMessageStatus" character varying NOT NULL DEFAULT 'no messages yet'`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2a2f05ef6c49d8b6f86a27e55c"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b1e5575d941a3f0ce8430c0edf"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5b8f656ac38b09c68a22854d55"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."latest_message"`);
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
  }
}

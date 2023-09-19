import { MigrationInterface, QueryRunner } from "typeorm";

export class LastMessageStatus1694781712936 implements MigrationInterface {
    name = 'LastMessageStatus1694781712936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","registration_view","121-service"]);
        await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD "lastMessageStatus" character varying NOT NULL DEFAULT 'No messages yet'`);
        await queryRunner.query(`
          UPDATE
              "registration"
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
                  registration
                LEFT JOIN twilio_message
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
            `)
        await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."note" AS "note", "registration"."noteUpdated" AS "noteUpdated", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC`);
        await queryRunner.query(`INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["121-service","VIEW","registration_view","SELECT \"registration\".\"id\" AS \"id\", \"registration\".\"programId\" AS \"programId\", \"registration\".\"registrationStatus\" AS \"status\", \"registration\".\"referenceId\" AS \"referenceId\", \"registration\".\"phoneNumber\" AS \"phoneNumber\", \"registration\".\"preferredLanguage\" AS \"preferredLanguage\", \"registration\".\"inclusionScore\" AS \"inclusionScore\", \"registration\".\"paymentAmountMultiplier\" AS \"paymentAmountMultiplier\", \"registration\".\"note\" AS \"note\", \"registration\".\"noteUpdated\" AS \"noteUpdated\", \"registration\".\"maxPayments\" AS \"maxPayments\", \"registration\".\"lastMessageStatus\" AS \"lastMessageStatus\", \"fsp\".\"fsp\" AS \"financialServiceProvider\", \"fsp\".\"fspDisplayNamePortal\" AS \"fspDisplayNamePortal\", CAST(CONCAT('PA #',registration.\"registrationProgramId\") as VARCHAR) AS \"personAffectedSequence\", registration.\"registrationProgramId\" AS \"registrationProgramId\" FROM \"121-service\".\"registration\" \"registration\" LEFT JOIN \"121-service\".\"fsp\" \"fsp\" ON \"fsp\".\"id\"=\"registration\".\"fspId\" ORDER BY \"registration\".\"registrationProgramId\" ASC"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","registration_view","121-service"]);
        await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP COLUMN "lastMessageStatus"`);
        await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."note" AS "note", "registration"."noteUpdated" AS "noteUpdated", "registration"."maxPayments" AS "maxPayments", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC`);
        await queryRunner.query(`INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["121-service","VIEW","registration_view","SELECT \"registration\".\"id\" AS \"id\", \"registration\".\"programId\" AS \"programId\", \"registration\".\"registrationStatus\" AS \"status\", \"registration\".\"referenceId\" AS \"referenceId\", \"registration\".\"phoneNumber\" AS \"phoneNumber\", \"registration\".\"preferredLanguage\" AS \"preferredLanguage\", \"registration\".\"inclusionScore\" AS \"inclusionScore\", \"registration\".\"paymentAmountMultiplier\" AS \"paymentAmountMultiplier\", \"registration\".\"note\" AS \"note\", \"registration\".\"noteUpdated\" AS \"noteUpdated\", \"registration\".\"maxPayments\" AS \"maxPayments\", \"fsp\".\"fsp\" AS \"financialServiceProvider\", \"fsp\".\"fspDisplayNamePortal\" AS \"fspDisplayNamePortal\", CAST(CONCAT('PA #',registration.\"registrationProgramId\") as VARCHAR) AS \"personAffectedSequence\", registration.\"registrationProgramId\" AS \"registrationProgramId\" FROM \"121-service\".\"registration\" \"registration\" LEFT JOIN \"121-service\".\"fsp\" \"fsp\" ON \"fsp\".\"id\"=\"registration\".\"fspId\" ORDER BY \"registration\".\"registrationProgramId\" ASC"]);
    }

}

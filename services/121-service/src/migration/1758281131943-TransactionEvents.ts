import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionEvents1758281131943 implements MigrationInterface {
  name = 'TransactionEvents1758281131943';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_edc9246b11c7368ca48fce10f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_fff8ff586a03d469256098b8f8"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."transaction_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "type" character varying NOT NULL, "description" character varying NOT NULL, "isSuccessfullyCompleted" boolean NOT NULL DEFAULT true, "errorMessage" character varying, "transactionId" integer NOT NULL, "programFspConfigurationId" integer, CONSTRAINT "PK_1b4101c76f4a2c8168aeb8f3bad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b636b04e270121a24f08d1af9b" ON "121-service"."transaction_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_695faaebd651cc12b4b295880d" ON "121-service"."transaction_event" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4f1b2124aaac715c149460ef4" ON "121-service"."transaction_event" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccc33883aa7599801353e53cf1" ON "121-service"."transaction_event" ("programFspConfigurationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "customData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "transactionStep"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "errorMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "transferValue" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "UQ_5ad8525fef1696e4388e007b4bc" UNIQUE ("registrationId", "paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_a6376dce877de0841fe63085ad4" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_f4f1b2124aaac715c149460ef45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_ccc33883aa7599801353e53cf19" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus",
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // only up
  }
}

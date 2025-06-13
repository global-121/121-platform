import { MigrationInterface, QueryRunner } from 'typeorm';

export class Test1749809919178 implements MigrationInterface {
  name = 'Test1749809919178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d8a56a1864ef40e1551833430bb"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d8a56a1864ef40e1551833430b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_fsp_configuration_property" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "value" character varying NOT NULL, "programFspConfigurationId" integer NOT NULL, CONSTRAINT "programFspConfigurationPropertyUnique" UNIQUE ("programFspConfigurationId", "name"), CONSTRAINT "PK_a71b424e4ed2168ecb5cda93dd6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b9a24d5c15e92e661112633fd" ON "121-service"."program_fsp_configuration_property" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_fsp_configuration" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "fspName" character varying NOT NULL, "name" character varying NOT NULL, "label" json NOT NULL, CONSTRAINT "programFspConfigurationUnique" UNIQUE ("programId", "name"), CONSTRAINT "PK_8c7b8aee32b9d0b173d656f7ac3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9c1fabe6ed57e114b586d3445" ON "121-service"."program_fsp_configuration" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fff8ff586a03d469256098b8f8" ON "121-service"."transaction" ("programFspConfigurationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_6be88e8576970978a911084534e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."fspName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus", 
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
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."fspName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC',
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
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_6be88e8576970978a911084534e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_fff8ff586a03d469256098b8f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e9c1fabe6ed57e114b586d3445"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_fsp_configuration"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4b9a24d5c15e92e661112633fd"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_fsp_configuration_property"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "programFspConfigurationId" TO "programFinancialServiceProviderConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFspConfigurationId" TO "programFinancialServiceProviderConfigurationId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d8a56a1864ef40e1551833430b" ON "121-service"."transaction" ("programFinancialServiceProviderConfigurationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d8a56a1864ef40e1551833430bb" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}

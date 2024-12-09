import { MigrationInterface, QueryRunner } from 'typeorm';

export class DuplicateView1733229093775 implements MigrationInterface {
  name = 'DuplicateView1733229093775';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`); // For similarity postgres function
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;`); // For levenshtein distance
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus", (CASE
            WHEN "registration"."id" IN (
              SELECT
                d1."registrationId"
              FROM
                "121-service".registration_attribute_data d1
              JOIN (
                SELECT
                    "programRegistrationAttributeId",
                    value
                FROM
                    "121-service".registration_attribute_data rad
                LEFT JOIN
                    "121-service".program_registration_attribute pra ON pra.id = rad."programRegistrationAttributeId"
                WHERE
                    value != '' AND pra."duplicateCheck"
                GROUP BY
                    "programRegistrationAttributeId",
                    value
                HAVING
                    COUNT(*) > 1
              ) d2
              ON
                d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId"
                AND d1.value = d2.value
            ) THEN TRUE
            ELSE FALSE
         END) AS "isDuplicate" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", (CASE\n            WHEN "registration"."id" IN (\n              SELECT\n                d1."registrationId"\n              FROM\n                "121-service".registration_attribute_data d1\n              JOIN (\n                SELECT\n                    "programRegistrationAttributeId",\n                    value\n                FROM\n                    "121-service".registration_attribute_data rad\n                LEFT JOIN\n                    "121-service".program_registration_attribute pra ON pra.id = rad.id\n                WHERE\n                    value != \'\' AND pra."duplicateCheck"\n                GROUP BY\n                    "programRegistrationAttributeId",\n                    value\n                HAVING\n                    COUNT(*) > 1\n              ) d2\n              ON\n                d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId"\n                AND d1.value = d2.value\n            ) THEN TRUE\n            ELSE FALSE\n         END) AS "isDuplicate" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
  }
}

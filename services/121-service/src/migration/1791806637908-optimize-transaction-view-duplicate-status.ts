import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeTransactionViewDuplicateStatus1791806637908 implements MigrationInterface {
  name = 'OptimizeTransactionViewDuplicateStatus1791806637908';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'transaction_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."transaction_view"`);
    await queryRunner.query(`CREATE VIEW "121-service"."transaction_view" AS SELECT "t"."id" AS "id", "t"."transferValue" AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", 
  (CASE WHEN EXISTS (
    SELECT 1
    FROM "121-service".registration_attribute_data d1
    INNER JOIN "121-service".program_registration_attribute pra
      ON d1."programRegistrationAttributeId" = pra.id
    INNER JOIN "121-service".registration_attribute_data d2
      ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId"
      AND d1.value = d2.value
      AND d1."registrationId" != d2."registrationId"
    INNER JOIN "121-service".registration registration2
      ON d2."registrationId" = registration2.id
      AND registration2."registrationStatus" != 'declined'
    WHERE d1."registrationId" = t."registrationId"
      AND registration."registrationStatus" != 'declined'
      AND d1.value != ''
      AND pra."duplicateCheck" = true
      AND NOT EXISTS (
        SELECT 1
        FROM "121-service".unique_registration_pair rup
        WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
          AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
      )
  ) THEN 'duplicate' ELSE 'unique' END)
 AS "registrationDuplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'transaction_view',
        'SELECT "t"."id" AS "id", "t"."transferValue" AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", \n  (CASE WHEN EXISTS (\n    SELECT 1\n    FROM "121-service".registration_attribute_data d1\n    INNER JOIN "121-service".program_registration_attribute pra\n      ON d1."programRegistrationAttributeId" = pra.id\n    INNER JOIN "121-service".registration_attribute_data d2\n      ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId"\n      AND d1.value = d2.value\n      AND d1."registrationId" != d2."registrationId"\n    INNER JOIN "121-service".registration registration2\n      ON d2."registrationId" = registration2.id\n      AND registration2."registrationStatus" != \'declined\'\n    WHERE d1."registrationId" = t."registrationId"\n      AND registration."registrationStatus" != \'declined\'\n      AND d1.value != \'\'\n      AND pra."duplicateCheck" = true\n      AND NOT EXISTS (\n        SELECT 1\n        FROM "121-service".unique_registration_pair rup\n        WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n          AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n      )\n  ) THEN \'duplicate\' ELSE \'unique\' END)\n AS "registrationDuplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"',
      ],
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}

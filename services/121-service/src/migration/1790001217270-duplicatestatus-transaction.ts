import { MigrationInterface, QueryRunner } from 'typeorm';

export class DuplicatestatusTransaction1790001217270 implements MigrationInterface {
  name = 'DuplicatestatusTransaction1790001217270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'transaction_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."transaction_view"`);
    await queryRunner.query(
      `CREATE VIEW "121-service"."transaction_view" AS SELECT "t"."id" AS "id", "t"."transferValue" AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", "registrationview"."duplicateStatus" AS "duplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"  LEFT JOIN "121-service"."registration_view" "registrationview" ON "t"."registrationId" = "registrationview"."id"`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'transaction_view',
        'SELECT "t"."id" AS "id", "t"."transferValue" AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", "registrationview"."duplicateStatus" AS "duplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"  LEFT JOIN "121-service"."registration_view" "registrationview" ON "t"."registrationId" = "registrationview"."id"',
      ],
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}

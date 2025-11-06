import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionViewPaginate1762435056189
  implements MigrationInterface
{
  name = 'TransactionViewPaginate1762435056189';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "121-service"."transaction_view" AS SELECT "t"."id" AS "id", "t"."created" AS "created", "t"."updated" AS "updated", "t"."userId" AS "userId", "t"."transferValue" AS "transferValue", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."fspName" AS "fspName", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."label" AS "programFspConfigurationLabel", "registration"."registrationStatus" AS "registrationStatus", "registration"."referenceId" AS "registrationReferenceId", "registration"."registrationProgramId" AS "registrationProgramId" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'transaction_view',
        'SELECT "t"."id" AS "id", "t"."created" AS "created", "t"."updated" AS "updated", "t"."userId" AS "userId", "t"."transferValue" AS "transferValue", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."fspName" AS "fspName", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."label" AS "programFspConfigurationLabel", "registration"."registrationStatus" AS "registrationStatus", "registration"."referenceId" AS "registrationReferenceId", "registration"."registrationProgramId" AS "registrationProgramId" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"',
      ],
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('We do not move down');
  }
}

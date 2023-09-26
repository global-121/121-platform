import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentCount1695387096506 implements MigrationInterface {
  name = 'PaymentCount1695387096506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_3a2576be389f520bece9d7dbb9" ON "121-service"."transaction" ("registrationId") `,
    );
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "paymentCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."note" AS "note", "registration"."noteUpdated" AS "noteUpdated", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(`UPDATE "121-service".registration oreg
        SET "paymentCount" = (
          SELECT COUNT(DISTINCT payment)
          FROM "121-service".transaction t
          WHERE t."registrationId" = oreg.id
        )
      `);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."note" AS "note", "registration"."noteUpdated" AS "noteUpdated", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "registration"."paymentCount" AS "paymentCount", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC',
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
      `ALTER TABLE "121-service"."registration" DROP COLUMN "paymentCount"`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."note" AS "note", "registration"."noteUpdated" AS "noteUpdated", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."note" AS "note", "registration"."noteUpdated" AS "noteUpdated", "registration"."maxPayments" AS "maxPayments", "registration"."lastMessageStatus" AS "lastMessageStatus", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3a2576be389f520bece9d7dbb9"`,
    );
  }
}

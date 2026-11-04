import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyNumericShadowColumns1793781455194 implements MigrationInterface {
  name = 'AddCurrencyNumericShadowColumns1793781455194';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "121-service"."program"
        ADD COLUMN "fixedTransferValueNumeric" numeric,
        ADD COLUMN "budgetNumeric" numeric
    `);
    await queryRunner.query(`
      ALTER TABLE "121-service"."transaction"
        ADD COLUMN "transferValueNumeric" numeric
    `);

    await queryRunner.query(`
      UPDATE "121-service"."program"
      SET "fixedTransferValueNumeric" = "fixedTransferValue"::text::numeric
      WHERE "fixedTransferValue" IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE "121-service"."program"
      SET "budgetNumeric" = "budget"::numeric
      WHERE "budget" IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE "121-service"."transaction"
      SET "transferValueNumeric" = "transferValue"::text::numeric
      WHERE "transferValue" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "121-service"."transaction"
        DROP COLUMN "transferValueNumeric"
    `);
    await queryRunner.query(`
      ALTER TABLE "121-service"."program"
        DROP COLUMN "fixedTransferValueNumeric",
        DROP COLUMN "budgetNumeric"
    `);
  }
}

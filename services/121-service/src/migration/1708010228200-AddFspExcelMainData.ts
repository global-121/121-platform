import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFspExcelMainData1708010228200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Excel FSP only if not exists yet
    const exists = await queryRunner.query(
      `SELECT * FROM "121-service"."fsp" WHERE "fsp" = 'Excel'`,
    );
    if (!exists || exists.length === 0) {
      await queryRunner.query(
        `INSERT INTO "121-service"."fsp" ("fsp", "fspDisplayNamePaApp", "integrationType", "fspDisplayNamePortal","hasReconciliation") VALUES ('Excel', '{ "en": "Excel Payment Instructions" }', 'csv', 'Excel Payment Instructions', true)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."fsp" WHERE "fsp" = 'Excel'`,
    );
  }
}

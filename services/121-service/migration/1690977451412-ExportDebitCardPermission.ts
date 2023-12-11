import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExportDebitCardPermission1690977451412
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    // Add the new permission
    await queryRunner.query(
      `INSERT INTO "121-service"."permission" ("name") VALUES ('fsp:debit-card.export')`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeprecatedCustomDataKey1729602981695 implements MigrationInterface {
  name = 'DeprecatedCustomDataKey1729602981695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "deprecatedCustomDataKeys"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "deprecatedCustomDataKeys" json NOT NULL DEFAULT '[]'`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class configureCustomAttributeExport1654085339175
  implements MigrationInterface {
  name = 'configureCustomAttributeExport1654085339175';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "export" json NOT NULL DEFAULT '["all-people-affected","included","selected-for-validation", "payment"]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "export"`,
    );
  }
}

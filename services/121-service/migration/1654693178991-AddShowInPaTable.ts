import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShowInPaTable1654693178991 implements MigrationInterface {
  name = 'AddShowInPaTable1654693178991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "export"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD "showInPaTable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "showInPaTable" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "showInPaTable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "showInPaTable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "export" json NOT NULL DEFAULT '["all-people-affected","included","selected-for-validation", "payment"]'`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class addShortLabel1658218507582 implements MigrationInterface {
  name = 'addShortLabel1658218507582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD "shortLabel" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "shortLabel" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "shortLabel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "shortLabel"`,
    );
  }
}

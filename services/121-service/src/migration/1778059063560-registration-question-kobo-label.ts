import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationQuestionKoboLabel1778059063560 implements MigrationInterface {
  name = 'RegistrationQuestionKoboabel1778059063560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "koboLabel" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboLabel" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "label" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "label" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboLabel" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "koboLabel"`,
    );
  }
}

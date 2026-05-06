import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationQuestionCustomLabel1778059063560 implements MigrationInterface {
  name = 'RegistrationQuestionCustomLabel1778059063560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "customLabel" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "customLabel"`,
    );
  }
}

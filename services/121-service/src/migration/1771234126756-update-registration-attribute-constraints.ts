import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRegistrationAttributeConstraints1771234126756 implements MigrationInterface {
  name = 'UpdateRegistrationAttributeConstraints1771234126756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP CONSTRAINT "CHK_4bf915660b25bdb76415741788"`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Progress is the way, cannot revert to previous state');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class KoboType1792075114643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "koboType" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboType" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the "koboType" column from the program_registration_attribute table.
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "koboType"`,
    );
  }
}

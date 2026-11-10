import { MigrationInterface, QueryRunner } from 'typeorm';

export class KoboType1792075114643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "koboInferredType" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboInferredType" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "koboInferredType"`,
    );
  }
}

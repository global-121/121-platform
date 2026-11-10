import { MigrationInterface, QueryRunner } from 'typeorm';

export class KoboType1792075114643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "koboInferredType" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboInferredType" DROP NOT NULL`,
    );

    await queryRunner.query(
      `UPDATE "121-service"."program_registration_attribute" AS attribute
       SET "koboInferredType" = attribute."type"
       FROM "121-service"."kobo" AS kobo
       WHERE kobo."programId" = attribute."programId"
       AND attribute."koboLabel" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "koboInferredType"`,
    );
  }
}

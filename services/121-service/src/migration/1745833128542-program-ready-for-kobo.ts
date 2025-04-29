import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramReadyForKobo1745833128542 implements MigrationInterface {
  name = 'ProgramReadyForKobo1745833128542';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "distributionDuration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "aboutProgram"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ADD "url" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "defaultMaxPayments" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "startDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "endDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "endDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "currency" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "fullnameNamingConvention" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "fullnameNamingConvention" SET DEFAULT '["fullName"]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "published" SET DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "fullnameNamingConvention" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "fullnameNamingConvention" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "currency" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "endDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "endDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "startDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "defaultMaxPayments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" DROP COLUMN "url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "aboutProgram" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "distributionDuration" integer`,
    );
  }
}

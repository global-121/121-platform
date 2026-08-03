import { MigrationInterface, QueryRunner } from 'typeorm';

export class VisaCardOrderAddAddresseeEmailAddress1785396780571 implements MigrationInterface {
  name = 'VisaCardOrderAddAddresseeEmailAddress1785396780571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" ADD "addresseeEmailAddress" character varying`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."intersolve_visa_card_order" SET "addresseeEmailAddress" = '' WHERE "addresseeEmailAddress" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" ALTER COLUMN "addresseeEmailAddress" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" DROP COLUMN "addresseeEmailAddress"`,
    );
  }
}

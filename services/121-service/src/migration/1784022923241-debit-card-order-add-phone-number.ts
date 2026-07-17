import { MigrationInterface, QueryRunner } from 'typeorm';

export class DebitCardOrderAddPhoneNumber1784022923241 implements MigrationInterface {
  name = 'DebitCardOrderAddPhoneNumber1784022923241';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" ADD "addresseePhoneNumber" character varying`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."intersolve_visa_card_order" SET "addresseePhoneNumber" = '+3160000000' WHERE "addresseePhoneNumber" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" ALTER COLUMN "addresseePhoneNumber" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" DROP COLUMN "addresseePhoneNumber"`,
    );
  }
}

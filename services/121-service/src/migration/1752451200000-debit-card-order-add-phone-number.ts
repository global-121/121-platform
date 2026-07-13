import { MigrationInterface, QueryRunner } from 'typeorm';

export class DebitCardOrderAddPhoneNumber1752451200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" ADD "addresseePhoneNumber" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" DROP COLUMN "addresseePhoneNumber"`,
    );
  }
}

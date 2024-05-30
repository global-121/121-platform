import { MigrationInterface, QueryRunner } from 'typeorm';

export class VisaSpentThisMonth1695302317427 implements MigrationInterface {
  name = 'VisaSpentThisMonth1695302317427';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "spentThisMonth" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "spentThisMonth"`,
    );
  }
}

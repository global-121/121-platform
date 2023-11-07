import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntersolveCardStatus1693821278357 implements MigrationInterface {
  name = 'IntersolveCardStatus1693821278357';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" RENAME "status" TO "walletStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "cardStatus" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" RENAME "status" TO "walletStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "cardStatus"`,
    );
  }
}

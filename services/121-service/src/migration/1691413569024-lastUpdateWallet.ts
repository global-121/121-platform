import { MigrationInterface, QueryRunner } from 'typeorm';

export class lastUpdateWallet1691413569024 implements MigrationInterface {
  name = 'lastUpdateWallet1691413569024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "lastExternalUpdate" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "lastExternalUpdate"`,
    );
  }
}

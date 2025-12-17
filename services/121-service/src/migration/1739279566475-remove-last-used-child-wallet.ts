import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLastUsedChildWallet1739279566475 implements MigrationInterface {
  name = 'RemoveLastUsedChildWallet1739279566475';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" DROP COLUMN "lastUsedDate"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ADD "lastUsedDate" TIMESTAMP`,
    );
  }
}

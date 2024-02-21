import { MigrationInterface, QueryRunner } from 'typeorm';

export class FspHasReconciliation1707916759830 implements MigrationInterface {
  name = 'FspHasReconciliation1707916759830';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" ADD "hasReconciliation" boolean NOT NULL DEFAULT false`,
    );

    // Update VodaCash and Excel to have reconciliation
    await queryRunner.query(
      `UPDATE "121-service"."fsp" SET "hasReconciliation" = true WHERE "fsp" IN ('VodaCash','Excel')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" DROP COLUMN "hasReconciliation"`,
    );
  }
}

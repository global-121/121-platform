import { MigrationInterface, QueryRunner } from 'typeorm';

export class FspHasReconciliation1707916759830 implements MigrationInterface {
  name = 'FspHasReconciliation1707916759830';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" ADD "hasReconciliation" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" DROP COLUMN "hasReconciliation"`,
    );
  }
}

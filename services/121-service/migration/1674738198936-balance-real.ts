import { MigrationInterface, QueryRunner } from 'typeorm';

export class balanceReal1674738198936 implements MigrationInterface {
  name = 'balanceReal1674738198936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0c44a38cc8ecd52da40a1e39f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "lastRequestedBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "lastRequestedBalance" real`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c44a38cc8ecd52da40a1e39f4" ON "121-service"."intersolve_barcode" ("lastRequestedBalance") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0c44a38cc8ecd52da40a1e39f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "lastRequestedBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "lastRequestedBalance" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c44a38cc8ecd52da40a1e39f4" ON "121-service"."intersolve_barcode" ("lastRequestedBalance") `,
    );
  }
}

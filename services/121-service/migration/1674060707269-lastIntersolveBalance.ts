import { MigrationInterface, QueryRunner } from 'typeorm';

export class lastIntersolveBalance1674060707269 implements MigrationInterface {
  name = 'lastIntersolveBalance1674060707269';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "lastRequestedBalance" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e914753ffd9085b51c2d34f49c" ON "121-service"."intersolve_barcode" ("send") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ea2587dfd620c3daaf7256ee0" ON "121-service"."intersolve_barcode" ("balanceUsed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c44a38cc8ecd52da40a1e39f4" ON "121-service"."intersolve_barcode" ("lastRequestedBalance") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "updatedLastRequestedBalance" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0c44a38cc8ecd52da40a1e39f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2ea2587dfd620c3daaf7256ee0"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e914753ffd9085b51c2d34f49c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "lastRequestedBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "updatedLastRequestedBalance"`,
    );
  }
}

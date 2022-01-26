import { MigrationInterface, QueryRunner } from 'typeorm';

export class availableForReuseIntersolveBarcode1643212947974
  implements MigrationInterface {
  name = 'availableForReuseIntersolveBarcode1643212947974';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "availableForReuse" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "availableForReuse"`,
    );
  }
}

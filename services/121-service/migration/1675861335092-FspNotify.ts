import { MigrationInterface, QueryRunner } from 'typeorm';

export class FspNotify1675861335092 implements MigrationInterface {
  name = 'FspNotify1675861335092';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" ADD "notifyOnTransaction" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" DROP COLUMN "notifyOnTransaction"`,
    );
  }
}

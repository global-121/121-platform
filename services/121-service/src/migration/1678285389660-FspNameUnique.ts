import { MigrationInterface, QueryRunner } from 'typeorm';

export class FspNameUnique1678285389660 implements MigrationInterface {
  name = 'FspNameUnique1678285389660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" ADD CONSTRAINT "UQ_24976e8e279fa20efc4557afcea" UNIQUE ("fsp")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" DROP CONSTRAINT "UQ_24976e8e279fa20efc4557afcea"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeQr1665582932627 implements MigrationInterface {
  name = 'removeQr1665582932627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "validationByQr"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "qrIdentifier"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "qrIdentifier" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "validationByQr" boolean NOT NULL DEFAULT false`,
    );
  }
}

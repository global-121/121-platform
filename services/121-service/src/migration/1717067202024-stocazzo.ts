import { MigrationInterface, QueryRunner } from 'typeorm';

export class Stocazzo1717067202024 implements MigrationInterface {
  name = 'Stocazzo1717067202024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "stocazzo" character varying DEFAULT 'blabla'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "stocazzo"`,
    );
  }
}

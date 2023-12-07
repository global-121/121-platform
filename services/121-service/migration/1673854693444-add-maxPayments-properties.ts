import { MigrationInterface, QueryRunner } from 'typeorm';

export class addMaxPaymentsProperties1673854693444
  implements MigrationInterface
{
  name = 'addMaxPaymentsProperties1673854693444';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "enableMaxPayments" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "maxPayments" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "maxPayments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "enableMaxPayments"`,
    );
  }
}

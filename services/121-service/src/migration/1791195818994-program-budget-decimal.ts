import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramBudgetDecimal1791195818994 implements MigrationInterface {
  name = 'ProgramBudgetDecimal1791195818994';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "budget" TYPE double precision USING "budget"::double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ALTER COLUMN "budget" TYPE integer USING "budget"::integer`,
    );
  }
}

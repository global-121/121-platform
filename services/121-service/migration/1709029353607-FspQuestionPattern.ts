import { MigrationInterface, QueryRunner } from 'typeorm';

export class FspQuestionPattern1709029353607 implements MigrationInterface {
  name = 'FspQuestionPattern1709029353607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD "pattern" character varying`,
    );

    await queryRunner.query(
      `UPDATE "121-service"."fsp_attribute" AS fa
      SET pattern = '.+'
      FROM "121-service"."fsp" AS f
      WHERE fa."fspId" = f.id and f.fsp = 'Intersolve-visa' and fa.name in ('addressStreet','addressPostalCode','addressCity')
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "pattern"`,
    );
  }
}

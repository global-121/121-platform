import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedProgramProperties1675263875654
  implements MigrationInterface
{
  name = 'RemoveUnusedProgramProperties1675263875654';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "minimumScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "descCashType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "inclusionCalculationType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "targetNrRegistrations" integer`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."program" SET "targetNrRegistrations" = "highestScoresX"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "highestScoresX"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "highestScoresX" integer`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."program" SET "highestScoresX" = "targetNrRegistrations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "targetNrRegistrations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "inclusionCalculationType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "descCashType" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "minimumScore" integer`,
    );
  }
}

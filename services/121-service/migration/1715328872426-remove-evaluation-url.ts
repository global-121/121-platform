import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEvaluationUrl1715328872426 implements MigrationInterface {
  name = 'RemoveEvaluationUrl1715328872426';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "evaluationDashboardUrl"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "evaluationDashboardUrl" character varying`,
    );
  }
}

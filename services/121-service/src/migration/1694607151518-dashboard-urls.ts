import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardUrls1694607151518 implements MigrationInterface {
  name = 'DashboardUrls1694607151518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "monitoringDashboardUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "evaluationDashboardUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "evaluationDashboardUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "monitoringDashboardUrl"`,
    );
  }
}

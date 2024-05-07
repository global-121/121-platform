import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMonitoringQuestion1714463812642
  implements MigrationInterface
{
  name = 'RemoveMonitoringQuestion1714463812642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationMonitoringQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP COLUMN "monitoringQuestionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP CONSTRAINT "UQ_08faaae1dc458def2084456b201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP COLUMN "monitoringQuestionId"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."monitoring_question"`);
  }

  public async down(): Promise<void> {
    // Down migration not implemented
  }
}

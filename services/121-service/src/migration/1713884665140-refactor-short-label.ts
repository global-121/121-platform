import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorShortLabel1713884665140 implements MigrationInterface {
  name = 'RefactorShortLabel1713884665140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "121-service"."program_question" SET "label" = "shortLabel" where "shortLabel" is not null`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "shortLabel"`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."financial_service_provider_question" SET "label" = "shortLabel" where "shortLabel" is not null`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP COLUMN "shortLabel"`,
    );
  }

  public async down(): Promise<void> {
    // Down migration not implemented
  }
}

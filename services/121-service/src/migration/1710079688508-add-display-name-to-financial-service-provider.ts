import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisplayNameToFinancialServiceProvider1710079688508 implements MigrationInterface {
  name = 'AddDisplayNameToFinancialServiceProvider1710079688508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider" ADD COLUMN IF NOT EXISTS "displayName" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider" DROP COLUMN "displayName"`,
    );
  }
}

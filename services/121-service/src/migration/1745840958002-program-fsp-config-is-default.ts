import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramFspConfigIsDefault1745840958002
  implements MigrationInterface
{
  name = 'ProgramFspConfigIsDefault1745840958002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" DROP COLUMN "isDefault"`,
    );
  }
}

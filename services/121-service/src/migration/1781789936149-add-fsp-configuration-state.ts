import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFspConfigurationState1781789936149 implements MigrationInterface {
  name = 'AddFspConfigurationState1781789936149';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD "fspIntegrationState" character varying`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."program_fsp_configuration" SET "fspIntegrationState" = 'integrated'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "fspIntegrationState" SET NOT NULL`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('Do we go down? No, the only way is up');
  }
}

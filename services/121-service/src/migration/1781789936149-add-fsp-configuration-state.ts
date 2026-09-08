import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFspConfigurationState1781789936149 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'AddFspConfigurationState1781789936149';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD "state" character varying`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."program_fsp_configuration" SET "state" = 'configured'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "state" SET NOT NULL`,
    );
  }
}

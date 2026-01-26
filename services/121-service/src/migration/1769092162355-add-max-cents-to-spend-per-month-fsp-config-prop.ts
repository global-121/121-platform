import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaxCentsToSpendPerMonthFspConfigProp1769092162355 implements MigrationInterface {
  name = 'AddMaxCentsToSpendPerMonthFspConfigProp1769092162355';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_fsp_configuration_property" ("programFspConfigurationId", "name", "value")
      SELECT pfc.id, 'maxToSpendPerMonthInCents', '15000'
      FROM "121-service"."program_fsp_configuration" pfc
      WHERE pfc."fspName" = 'Intersolve-visa';
    `);
  }

  public async down(): Promise<void> {
    'we never do down migrations';
  }
}

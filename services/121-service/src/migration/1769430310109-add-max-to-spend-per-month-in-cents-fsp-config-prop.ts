import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaxToSpendPerMonthInCentsFspConfigProp1769430310109 implements MigrationInterface {
  name = 'AddMaxToSpendPerMonthInCentsFspConfigProp1769430310109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_fsp_configuration_property" ("programFspConfigurationId", "name", "value")
      SELECT pfc.id, 'maxToSpendPerMonthInCents', '15000'
      FROM "121-service"."program_fsp_configuration" pfc
      WHERE pfc."fspName" = 'Intersolve-visa';
    `);
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}

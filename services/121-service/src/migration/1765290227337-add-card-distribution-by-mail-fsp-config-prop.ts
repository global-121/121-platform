import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardDistributionByMailFspConfigProp1765290227337 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'AddCardDistributionByMailFspConfigProp1765290227337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_fsp_configuration_property" ("programFspConfigurationId", "name", "value")
      SELECT pfc.id, 'cardDistributionByMail', 'true'
      FROM "121-service"."program_fsp_configuration" pfc
      WHERE pfc."fspName" = 'intersolveVisa';
    `);
  }
}

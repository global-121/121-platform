import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardDistributionByMailFspConfigProp1765290227337
  implements MigrationInterface
{
  name = 'AddCardDistributionByMailFspConfigProp1765290227337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_fsp_configuration_property" ("programFspConfigurationId", "name", "value")
      SELECT pfc.id, 'cardDistributionByMail', 'true'
      FROM "121-service"."program_fsp_configuration" pfc
      WHERE pfc."fspName" = 'intersolveVisa';
    `);
  }

  public async down(_q: QueryRunner): Promise<void> {
    console.log(
      'The only way to make sense out of change is to plunge into it, move with it. There is no going back.',
    );
  }
}

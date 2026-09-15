import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';

export class AddCurrencyCodeOnafriqFspConfigProp1789475507841 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!env.ONAFRIQ_CURRENCY_CODE) {
      // No Onafriq currency configured in this environment, so there is nothing to backfill
      return;
    }

    await queryRunner.query(
      `
      INSERT INTO "121-service"."program_fsp_configuration_property" ("programFspConfigurationId", "name", "value")
      SELECT pfc.id, 'currencyCodeOnafriq', $1
      FROM "121-service"."program_fsp_configuration" pfc
      WHERE pfc."fspName" = 'Onafriq'
      ON CONFLICT ("programFspConfigurationId", "name") DO NOTHING;
    `,
      [env.ONAFRIQ_CURRENCY_CODE],
    );
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}

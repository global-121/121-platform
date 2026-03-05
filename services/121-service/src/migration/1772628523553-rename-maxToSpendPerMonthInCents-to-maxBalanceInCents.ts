import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameMaxToSpendPerMonthInCentsToMaxBalanceInCents1772628523553 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "121-service"."program_fsp_configuration_property"
      SET "name" = 'maxBalanceInCents'
      WHERE "name" = 'maxToSpendPerMonthInCents';
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error('Down migrations are not supported.');
  }
}

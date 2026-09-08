import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameMaxToSpendPerMonthInCentsToMaxBalanceInCents1772628523553 implements Omit<
  MigrationInterface,
  'down'
> {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "121-service"."program_fsp_configuration_property"
      SET "name" = 'maxBalanceInCents'
      WHERE "name" = 'maxToSpendPerMonthInCents';
    `);
  }
}

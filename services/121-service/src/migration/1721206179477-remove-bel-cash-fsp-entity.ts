import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveBelCashFspEntity1721206179477 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'RemoveBelCashFspEntity1721206179477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the table if it exists
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."belcash_request"`,
    );
  }
}

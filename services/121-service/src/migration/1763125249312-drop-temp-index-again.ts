import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTempIndexAgain1763125249312 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'DropTempIndexAgain1763125249312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."idx_transaction_event_description"`,
    );
  }
}

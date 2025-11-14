import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTransferTransaction1763105665428
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transaction_event_description ON "121-service".transaction_event(description);

      UPDATE "121-service".transaction_event
      SET description = 'Transaction created'
      WHERE description = 'Transfer created';

      UPDATE "121-service".transaction_event
      SET description = 'Transaction started'
      WHERE description = 'Transfer started';

      UPDATE "121-service".transaction_event
      SET description = 'Transaction retried'
      WHERE description = 'Transfer retried';

      UPDATE "121-service".transaction_event
      SET description = 'Transaction approval'
      WHERE description = 'Transfer approval';

      DROP INDEX IF EXISTS idx_transaction_event_description;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }
}

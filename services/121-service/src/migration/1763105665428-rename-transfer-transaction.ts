import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTransferTransaction1763105665428 implements Omit<
  MigrationInterface,
  'down'
> {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transaction_event_description ON "121-service".transaction_event(description);
    `);
    await queryRunner.query(`
      UPDATE "121-service".transaction_event
      SET description = 'Transaction created'
      WHERE description = 'Transfer created';
    `);
    await queryRunner.query(`
      UPDATE "121-service".transaction_event
      SET description = 'Transaction started'
      WHERE description = 'Transfer started';
    `);
    await queryRunner.query(`
      UPDATE "121-service".transaction_event
      SET description = 'Transaction retried'
      WHERE description = 'Transfer retried';
    `);
    await queryRunner.query(`
      UPDATE "121-service".transaction_event
      SET description = 'Transaction approval'
      WHERE description = 'Transfer approval';
    `);
  }
}

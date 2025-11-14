import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTransferTransaction1763105665428
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE "121-service".transaction_event
            SET description = REPLACE(description, 'Transfer', 'Transaction')
            WHERE description LIKE '%Transfer%';
        `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }
}

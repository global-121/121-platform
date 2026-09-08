import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveHangingFspTable1750430434683 implements Omit<
  MigrationInterface,
  'down'
> {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Could not be done in the previous migration because of the FK constraints
    // It's done in a separate migration so there is a db commit in between
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service".financial_service_provider`,
    );
  }
}

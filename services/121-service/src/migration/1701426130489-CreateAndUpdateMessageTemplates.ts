import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAndUpdateMessageTemplates1701426130489 implements Omit<
  MigrationInterface,
  'down'
> {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }
}

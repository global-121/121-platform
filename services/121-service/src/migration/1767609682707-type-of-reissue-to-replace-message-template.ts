import { MigrationInterface, QueryRunner } from 'typeorm';

export class TypeOfReissueToReplaceMessageTemplate1767609682707 implements Omit<
  MigrationInterface,
  'down'
> {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE "121-service".message_template
            SET type = 'replaceVisaCard'
            WHERE type = 'reissueVisaCard'
        `);
  }
}

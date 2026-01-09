import { MigrationInterface, QueryRunner } from 'typeorm';

export class TypeOfReissueToReplaceMessageTemplate1767609682707 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE "121-service".message_template
            SET type = 'replaceVisaCard'
            WHERE type = 'reissueVisaCard'
        `);
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Never going to give you up, never going to migrate down...');
  }
}

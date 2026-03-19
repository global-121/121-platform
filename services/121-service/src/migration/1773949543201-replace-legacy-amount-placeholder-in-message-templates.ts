import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceLegacyAmountPlaceholderInMessageTemplates1773949543201
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "121-service"."message_template"
      SET "message" = REPLACE("message", '[[1]]', '{{amountTransferred}}')
      WHERE "message" LIKE '%[[1]]%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "121-service"."message_template"
      SET "message" = REPLACE("message", '{{amountTransferred}}', '[[1]]')
      WHERE "message" LIKE '%{{amountTransferred}}%'
    `);
  }
}

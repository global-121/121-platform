import { MigrationInterface, QueryRunner } from 'typeorm';

export class espocrmWebhookUnique1678353552539 implements MigrationInterface {
  name = 'espocrmWebhookUnique1678353552539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."espocrm_webhook" ADD CONSTRAINT "espocrmWebhookActionTypeEnityType" UNIQUE ("actionType", "entityType")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."espocrm_webhook" DROP CONSTRAINT "espocrmWebhookActionTypeEnityType"`,
    );
  }
}

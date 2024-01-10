import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateLabel1704893720560 implements MigrationInterface {
  name = 'TemplateLabel1704893720560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "label" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "isSendMessageTemplate" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP COLUMN "isSendMessageTemplate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP COLUMN "label"`,
    );
  }
}

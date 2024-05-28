import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateLabel1704893720560 implements MigrationInterface {
  name = 'TemplateLabel1704893720560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "label" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "isSendMessageTemplate" boolean NOT NULL DEFAULT false`,
    );

    //
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "isSendMessageTemplate" = true WHERE "type" IN ('invited','included','inclusionEnded','rejected','remindInvite','prepareToEndInclusion')`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "label" = '{"en": "Invite"}' where type = 'invited'`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "label" = '{"en": "Include"}' where type = 'included'`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "label" = '{"en": "End inclusion"}' where type = 'inclusionEnded'`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "label" = '{"en": "Reject"}' where type = 'rejected'`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "label" = '{"en": "Remind invite"}' where type = 'remindInvite'`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."message_template" SET "label" = '{"en": "Prepare to end inclusion"}' where type = 'prepareToEndInclusion'`,
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

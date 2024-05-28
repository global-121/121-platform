import { MigrationInterface, QueryRunner } from 'typeorm';

export class addContenttypeToTwilioMessage1672834949285
  implements MigrationInterface
{
  name = 'addContenttypeToTwilioMessage1672834949285';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "contentType" character varying NOT NULL DEFAULT 'custom'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "errorCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "errorMessage" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD "contentType" character varying NOT NULL DEFAULT 'custom'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP COLUMN "contentType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "errorMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "errorCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "contentType"`,
    );
  }
}

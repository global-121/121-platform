import { MigrationInterface, QueryRunner } from 'typeorm';

export class twilioRetry1690372019421 implements MigrationInterface {
  name = 'twilioRetry1690372019421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "retryCount" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "retryCount"`,
    );
  }
}

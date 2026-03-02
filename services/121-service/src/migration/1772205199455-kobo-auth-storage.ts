import { MigrationInterface, QueryRunner } from 'typeorm';

export class KoboAuthStorage1772205199455 implements MigrationInterface {
  name = 'KoboAuthStorage1772205199455';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ADD COLUMN IF NOT EXISTS "webhookAuthUsername" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ADD COLUMN IF NOT EXISTS "webhookAuthPassword" character varying`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."kobo" SET "webhookAuthUsername" = gen_random_uuid()::text WHERE "webhookAuthUsername" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."kobo" SET "webhookAuthPassword" = gen_random_uuid()::text WHERE "webhookAuthPassword" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ALTER COLUMN "webhookAuthUsername" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ALTER COLUMN "webhookAuthPassword" SET NOT NULL`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Never going to give you up, never going to migrate down');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class transactionMessageRelation1691761756517
  implements MigrationInterface
{
  name = 'transactionMessageRelation1691761756517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD COLUMN IF NOT EXISTS "transactionId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT IF EXISTS "UQ_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b" UNIQUE ("transactionId")`,
    );
    await queryRunner.query(`UPDATE "121-service"."twilio_message"
        SET "transactionId" = t."id"
        FROM (
            SELECT
                t1."id",
                t1."customData" ->> 'messageSid' AS "messageSid"
            FROM
                "121-service"."transaction" t1
            JOIN
                "121-service"."twilio_message" t2 ON t1."customData" ->> 'messageSid' = t2."sid"
        ) t
        WHERE
            "121-service"."twilio_message"."sid" = t."messageSid";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "transactionId"`,
    );
  }
}

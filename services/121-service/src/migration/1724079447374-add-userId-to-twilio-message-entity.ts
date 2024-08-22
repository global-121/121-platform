import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToTwilioMessageEntity1724079447374
  implements MigrationInterface
{
  name = 'AddUserIdToTwilioMessageEntity1724079447374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "userId" integer`,
    );

    await queryRunner.query(`
      UPDATE "121-service"."twilio_message" tm
      SET "userId" = t."userId"
      FROM "121-service"."transaction" t
      WHERE tm."transactionId" = t."id"
      AND tm."transactionId" IS NOT NULL
      AND t."userId" IS NOT NULL;
    `);

    await queryRunner.query(
      `UPDATE "121-service"."twilio_message"
       SET "userId" = (
         SELECT id FROM "121-service"."user" WHERE "username" LIKE 'admin@%' LIMIT 1
       )
       WHERE "userId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ALTER COLUMN "userId" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

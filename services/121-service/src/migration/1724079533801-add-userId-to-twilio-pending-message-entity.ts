import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToTwilioPendingMessageEntity1724079533801
  implements MigrationInterface
{
  name = 'AddUserIdToTwilioPendingMessageEntity1724079533801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD "userId" integer`,
    );

    await queryRunner.query(
      `UPDATE "121-service"."whatsapp_pending_message"
       SET "userId" = (
         SELECT id FROM "121-service"."user" WHERE "username" LIKE 'admin@%' LIMIT 1
       )
       WHERE "userId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ALTER COLUMN "userId" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ALTER COLUMN "userId" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToPendingMessageEntity1723206168478
  implements MigrationInterface
{
  name = 'AddUserIdToPendingMessageEntity1723206168478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD "userId" integer`,
    );

    await queryRunner.query(
      `UPDATE "121-service"."whatsapp_pending_message" SET "userId" = 1 WHERE "userId" IS NULL`,
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
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP COLUMN "userId"`,
    );
  }
}

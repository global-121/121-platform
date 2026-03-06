import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserIdConstrainOnMessage1772176511894 implements MigrationInterface {
  name = 'RemoveUserIdConstrainOnMessage1772176511894';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Nothing to see here.');
  }
}

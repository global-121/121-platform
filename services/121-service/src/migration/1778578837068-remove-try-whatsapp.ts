import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTryWhatsapp1778578837068 implements MigrationInterface {
  name = 'RemoveTryWhatsapp1778578837068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "tryWhatsAppFirst"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."try_whatsapp"`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('No way down, only forward');
  }
}

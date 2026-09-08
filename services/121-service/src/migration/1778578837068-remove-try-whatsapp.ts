import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTryWhatsapp1778578837068 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'RemoveTryWhatsapp1778578837068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "tryWhatsAppFirst"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."try_whatsapp"`,
    );
  }
}

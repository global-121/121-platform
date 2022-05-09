import { MigrationInterface, QueryRunner } from 'typeorm';

export class addTryWhatsAppFirst1652101657752 implements MigrationInterface {
  name = 'addTryWhatsAppFirst1652101657752';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "tryWhatsAppFirst" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "tryWhatsAppFirst"`,
    );
  }
}

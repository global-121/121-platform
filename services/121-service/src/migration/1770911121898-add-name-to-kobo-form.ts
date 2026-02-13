import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameToKoboForm1770911121898 implements MigrationInterface {
  name = 'AddNameToKoboForm1770911121898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ADD "name" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" DROP COLUMN "name"`,
    );
  }
}

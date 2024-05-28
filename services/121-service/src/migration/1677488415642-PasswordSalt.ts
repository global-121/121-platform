import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordSalt1677488415642 implements MigrationInterface {
  name = 'PasswordSalt1677488415642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "salt" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "salt"`,
    );
  }
}

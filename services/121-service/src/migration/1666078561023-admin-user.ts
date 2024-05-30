import { MigrationInterface, QueryRunner } from 'typeorm';

export class adminUser1666078561023 implements MigrationInterface {
  name = 'adminUser1666078561023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "admin" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "admin"`,
    );
  }
}

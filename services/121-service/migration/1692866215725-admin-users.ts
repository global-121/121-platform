import { MigrationInterface, QueryRunner } from 'typeorm';

export class adminUsers1692866215725 implements MigrationInterface {
  name = 'adminUsers1692866215725';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "lastLogin" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "lastLogin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "active"`,
    );
  }
}
